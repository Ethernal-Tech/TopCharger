import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
  TransactionInstruction,
  Transaction,
  SystemProgram,
  AccountInfo,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import bs58 from "bs58";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

// -------------------------
// RPC + Payer
// -------------------------

export const connection = new Connection(
  process.env.SOLANA_RPC_URL || clusterApiUrl("devnet"),
  { commitment: "confirmed" }
);

function loadKeypair(): Keypair {
  const b58 = process.env.SOLANA_PAYER_SECRET;
  if (b58) return Keypair.fromSecretKey(bs58.decode(b58));

  const file = process.env.SOLANA_PAYER_SECRET_FILE;
  if (file && fs.existsSync(file)) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as number[];
    const secretKey = Uint8Array.from(raw);
    return Keypair.fromSecretKey(secretKey);
  }

  throw new Error("Missing SOLANA_PAYER_SECRET or SOLANA_PAYER_SECRET_FILE");
}

export const payer = loadKeypair();

export function clusterQueryParam(): "devnet" | "testnet" | "mainnet" {
  const url = process.env.SOLANA_RPC_URL || "";
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  return "mainnet";
}

// -------------------------
// Simple placeholder (sessions on-chain later)
// -------------------------

export type SolanaTxKind = "START" | "STOP";

export type SolanaTxResult = {
  signature: string;
};

export async function sendSessionTx(
  _kind: SolanaTxKind,
  _args: { sessionId: string }
): Promise<SolanaTxResult> {
  void _kind;
  void _args;
  return { signature: "SIMULATED_SIG" };
}

// -------------------------
// Roles + hashing helpers
// -------------------------

// web2 -> on-chain role mapping
function roleToU8(role: "HOST" | "DRIVER" | "UNSET" | "ADMIN"): number {
  switch (role) {
    case "HOST":
      return 1;
    case "DRIVER":
      return 0;
    case "ADMIN":
      return 2;
    case "UNSET":
    default:
      return 3;
  }
}

function roleFromU8(n: number): "DRIVER" | "HOST" | "UNKNOWN" {
  if (n === 0) return "DRIVER";
  if (n === 1) return "HOST";
  return "UNKNOWN";
}

function sha256_32(input: string): Buffer {
  return crypto
    .createHash("sha256")
    .update(input, "utf8")
    .digest()
    .subarray(0, 32);
}

export function hashToU64(s: string): bigint {
  const h = crypto.createHash("sha256").update(s, "utf8").digest(); // 32 bytes
  // take first 8 bytes little-endian as u64
  return BigInt.asUintN(
    64,
    BigInt("0x" + Buffer.from(h.subarray(0, 8)).reverse().toString("hex"))
  );
}

// -------------------------
// IDL (single canonical path)
// -------------------------

const idlPath = path.join(
  process.cwd(),
  "target",
  "idl",
  "topcharger_program.json"
);

/** Anchor Idl extended with discriminator + optional program address fields that appear in JSON builds. */
type IdlWithDisc = Idl & {
  metadata?: { address?: string };
  address?: string;
  instructions: Array<{ name: string; discriminator?: number[] }>;
};

function loadIdl(): IdlWithDisc {
  const raw = fs.readFileSync(idlPath, "utf8");
  const idl = JSON.parse(raw) as IdlWithDisc;
  if (!idl?.instructions || !Array.isArray(idl.instructions)) {
    throw new Error(`Invalid IDL: no instructions at ${idlPath}`);
  }
  return idl;
}

function discriminatorFor(ixName: string): Buffer {
  const idl = loadIdl();
  console.debug(`[solana] discriminatorFor("${ixName}") → reading IDL from:`, idlPath);
  const ix = idl.instructions.find((i) => i.name === ixName);
  if (!ix?.discriminator) {
    throw new Error(
      `IDL discriminator not found for "${ixName}" at ${idlPath}`
    );
  }
  return Buffer.from(ix.discriminator);
}

function getProgramId(): PublicKey {
  // Prefer env override; fall back to IDL-embedded address if present
  const idl = loadIdl();
  const fromEnv = process.env.TOPCHARGER_PROGRAM_ID;
  const addr =
    fromEnv ?? idl.metadata?.address ?? (idl.address as string | undefined);
  if (!addr)
    throw new Error("TOPCHARGER_PROGRAM_ID not set and IDL has no address");
  return new PublicKey(addr);
}

// -------------------------
// User register / fetch
// -------------------------

/**
 * Register a user on-chain (devnet) via Anchor-compatible flow.
 * Returns { signature, userPda }. Idempotent at the PDA level.
 */
export async function registerUserOnChain(
  userId: string,
  role: "HOST" | "DRIVER" | "UNSET" | "ADMIN"
): Promise<{ signature: string; userPda: string }> {
  // Use Anchor provider for signing (ANCHOR_WALLET / ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet as anchor.Wallet;

  const programId = getProgramId(); // unified

  const roleU8 = roleToU8(role);
  const userHash = sha256_32(userId);
  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userHash],
    programId
  );

  const discriminator = discriminatorFor("register_user");
  const argsBuf = Buffer.concat([Buffer.from([roleU8 & 0xff]), userHash]);
  const data = Buffer.concat([discriminator, argsBuf]);

  const keys = [
    { pubkey: userPda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: false, isWritable: false }, // authority
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true }, // payer
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId, keys, data });
  const tx = new Transaction().add(ix);
  tx.feePayer = wallet.publicKey;

  const latest = await provider.connection.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;

  const signed = await wallet.signTransaction(tx);
  const sig = await provider.connection.sendRawTransaction(signed.serialize());
  await provider.connection.confirmTransaction({
    signature: sig,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  });

  return { signature: sig, userPda: userPda.toBase58() };
}

/** Derive the User PDA from backend userId (no IDL needed). */
export async function deriveUserPdaFromUserId(
  userId: string
): Promise<PublicKey> {
  const programId = getProgramId();
  const userHash = sha256_32(userId);
  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userHash],
    programId
  );
  return userPda;
}

/** Manual decode of the on-chain User account without full IDL decode. */
function decodeUserAccount(data: Buffer) {
  // Expect 8 (disc) + 32 (hash) + 1 (role) + 32 (wallet) = 73 bytes
  if (data.length < 73)
    throw new Error(`User account too small: ${data.length} bytes`);
  const view = data.subarray(8); // skip 8-byte Anchor discriminator

  const userIdHash = view.subarray(0, 32); // [0..32)
  const roleU8 = view.readUInt8(32); // byte 32
  const walletRaw = view.subarray(33, 65); // [33..65)

  const wallet = new PublicKey(walletRaw);
  return {
    userIdHashHex: Buffer.from(userIdHash).toString("hex"),
    roleU8,
    role: roleFromU8(roleU8),
    wallet: wallet.toBase58(),
  };
}

/** Fetch + decode by PDA (string). */
export async function fetchUserAccountByPda(userPdaStr: string) {
  const userPda = new PublicKey(userPdaStr);
  const info: AccountInfo<Buffer> | null = await connection.getAccountInfo(
    userPda
  );
  if (!info) return null;

  const decoded = decodeUserAccount(info.data);
  return {
    pda: userPda.toBase58(),
    lamports: info.lamports,
    owner: info.owner.toBase58(),
    ...decoded,
  };
}

/** Derive PDA from backend userId, then fetch + decode. */
export async function fetchUserAccountByUserId(userId: string) {
  const userPda = await deriveUserPdaFromUserId(userId);
  return fetchUserAccountByPda(userPda.toBase58());
}

// -------------------------
// Charger helpers + on-chain create
// -------------------------

// Derive charger PDA (seeds: "charger", host_user_hash, charger_id_u64_le)
export function deriveChargerPda(
  hostUserHash32: Buffer,
  chargerIdU64: bigint
): PublicKey {
  const programId = getProgramId();
  const idLe8 = Buffer.alloc(8);
  idLe8.writeBigUInt64LE(chargerIdU64);
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("charger"), hostUserHash32, idLe8],
    programId
  );
  return pda;
}

/**
 * Send `create_charger` instruction.
 * On-chain schema:
 *   args: user_id_hash [u8;32], charger_id u64(le), power_kw u16(le), supply_type u8, price u64(le)
 *   accounts: charger(pda, writable, init), wallet, authority(signer), system_program
 *
 * MVP: payer is both wallet & authority.
 */
export async function createChargerOnChain(args: {
  backendUserId: string; // host's backend user id
  chargerIdU64: bigint; // persisted in DB as chainId
  powerKw: number; // from Charger.powerKw
  supplyType: number; // 0=renewable, 1=non-renewable (your choice)
  priceMicrousdPerKwh: bigint; // u64 microusd/kWh
}): Promise<{ signature: string; chargerPda: string }> {
  const {
    backendUserId,
    chargerIdU64,
    powerKw,
    supplyType,
    priceMicrousdPerKwh,
  } = args;

  const programId = getProgramId();

  const userHash = sha256_32(backendUserId);
  const chargerPda = deriveChargerPda(userHash, chargerIdU64);

  // Discriminator from IDL (no hardcode)
  const discriminator = discriminatorFor("create_charger");

  // Build args buffer
  const idLe8 = Buffer.alloc(8);
  idLe8.writeBigUInt64LE(chargerIdU64);

  const powerLe2 = Buffer.alloc(2);
  powerLe2.writeUInt16LE(Math.max(0, Math.min(65535, Math.round(powerKw))));

  const priceLe8 = Buffer.alloc(8);
  priceLe8.writeBigUInt64LE(priceMicrousdPerKwh);

  const data = Buffer.concat([
    discriminator, // 8
    userHash, // 32
    idLe8, // 8
    powerLe2, // 2
    Buffer.from([supplyType & 0xff]), // 1
    priceLe8, // 8
  ]);

  // Accounts
  const keys = [
    { pubkey: chargerPda, isSigner: false, isWritable: true },
    { pubkey: payer.publicKey, isSigner: false, isWritable: false }, // wallet (host wallet for MVP)
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // authority signer
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId, keys, data });

  const tx = new Transaction().add(ix);
  tx.feePayer = payer.publicKey;

  const latest = await connection.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;

  // Sign & send
  tx.sign(payer);
  const signature = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction({
    signature,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  });

  return { signature, chargerPda: chargerPda.toBase58() };
}

// -------------------------
// Match (reserve/confirm) pipeline
// -------------------------

function programId(): PublicKey {
  return getProgramId();
}

export async function deriveMatchPda(
  chargerPubkey: PublicKey
): Promise<PublicKey> {
  const pid = programId();
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("match"), chargerPubkey.toBuffer()],
    pid
  );
  return pda;
}

export type ReserveChargerArgs = {
  backendUserId: string; // driver backend id -> hashed on-chain
  chargerPda: string; // base58 PDA of ChargerAccount (must exist)
};

export async function sendReserveCharger(
  args: ReserveChargerArgs
): Promise<{ signature: string; matchPda: string }> {
  const pid = programId();
  const charger = new PublicKey(args.chargerPda);
  const matchPda = await deriveMatchPda(charger);

  const disc = discriminatorFor("reserve_charger");
  const driverHash = sha256_32(args.backendUserId); // [u8;32]
  const data = Buffer.concat([disc, driverHash]);

  const keys = [
    { pubkey: charger, isSigner: false, isWritable: true },
    { pubkey: matchPda, isSigner: false, isWritable: true },
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, // authority
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId: pid, keys, data });
  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });

  return { signature, matchPda: matchPda.toBase58() };
}

export type ConfirmChargeArgs = {
  matchPda: string; // base58 PDA of MatchAccount
  wasCorrect: boolean;
};

export async function sendConfirmCharge(
  args: ConfirmChargeArgs
): Promise<{ signature: string }> {
  const pid = programId();
  const matchPubkey = new PublicKey(args.matchPda);

  const disc = discriminatorFor("confirm_charge");
  const data = Buffer.concat([disc, Buffer.from([args.wasCorrect ? 1 : 0])]);

  const keys = [{ pubkey: matchPubkey, isSigner: false, isWritable: true }];

  const ix = new TransactionInstruction({ programId: pid, keys, data });
  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
    commitment: "confirmed",
  });

  return { signature };
}
