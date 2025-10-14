import {
  Connection,
  Keypair,
  clusterApiUrl,
  PublicKey,
  TransactionInstruction,
  Transaction,
  SystemProgram,
  AccountInfo,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import bs58 from "bs58";
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

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

export type SolanaTxKind = "START" | "STOP";

export type SolanaTxResult = {
  signature: string; // tx sig
};

export async function sendSessionTx(
  _kind: SolanaTxKind,
  _args: { sessionId: string }
): Promise<SolanaTxResult> {
  // mark as intentionally unused (avoids @typescript-eslint/no-unused-vars)
  void _kind;
  void _args;

  // Placeholder for later: 1) build ix 2) send & confirm
  return { signature: "SIMULATED_SIG" };
}

// Map your app roles to a compact u8 value used by the program
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

function hashUserIdTo32(userId: string): Buffer {
  // Deterministic 32-byte hash
  return crypto
    .createHash("sha256")
    .update(userId, "utf8")
    .digest()
    .subarray(0, 32);
}

/** Extend the Anchor Idl with the discriminator present in built JSONs */
type IdlWithDisc = Idl & {
  metadata?: { address?: string };
  address?: string;
  instructions: Array<{ name: string; discriminator: number[] }>;
};

/**
 * Register a user on-chain (devnet) via Anchor-compatible flow.
 * Returns { signature, userPda }.
 * Idempotent at the PDA level (your program should no-op if already initialized).
 */
export async function registerUserOnChain(
  userId: string,
  role: "HOST" | "DRIVER" | "UNSET" | "ADMIN"
) {
  // If the project is launched via `anchor test`/env, this binds to env provider.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const wallet = provider.wallet as anchor.Wallet;

  // Resolve Anchor workspace root and load IDL JSON (no require())
  const probableProgramRoot = path.resolve(__dirname, "..", ".."); // adjust if needed
  const anchorTomlPath = path.join(probableProgramRoot, "Anchor.toml");
  if (fs.existsSync(anchorTomlPath)) process.chdir(probableProgramRoot);

  const idlPath = path.join(
    process.cwd(),
    "target",
    "idl",
    "topcharger_program.json"
  );
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as IdlWithDisc;

  const programId = new PublicKey(
    process.env.TOPCHARGER_PROGRAM_ID ??
      idl.metadata?.address ??
      (idl.address as string)
  );

  const roleU8 = roleToU8(role);
  const userHash = hashUserIdTo32(userId);

  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userHash],
    programId
  );

  const ixDesc = idl.instructions.find((ix) => ix.name === "register_user");
  if (!ixDesc) throw new Error("register_user instruction not found in IDL");

  const discriminator = Buffer.from(ixDesc.discriminator);
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

  return { signature: sig as string, userPda: userPda.toBase58() };
}
// --- Role mapping aligned to on-chain: 0 = DRIVER, 1 = HOST ---
function roleFromU8(n: number): "DRIVER" | "HOST" | "UNKNOWN" {
  if (n === 0) return "DRIVER";
  if (n === 1) return "HOST";
  return "UNKNOWN";
}

function sha256_32(userId: string): Buffer {
  return crypto.createHash("sha256").update(userId, "utf8").digest().subarray(0, 32);
}

/** Derive the User PDA from backend userId (no IDL needed). */
export async function deriveUserPdaFromUserId(userId: string): Promise<PublicKey> {
  const programIdStr = process.env.TOPCHARGER_PROGRAM_ID;
  if (!programIdStr) throw new Error("TOPCHARGER_PROGRAM_ID not set");
  const programId = new PublicKey(programIdStr);

  const userHash = sha256_32(userId);
  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userHash],
    programId
  );
  return userPda;
}

/** Manual decode of the on-chain User account without IDL (Anchor discriminator + struct). */
function decodeUserAccount(data: Buffer) {
  // Expect 8 (disc) + 32 (hash) + 1 (role) + 32 (wallet) = 73 bytes
  if (data.length < 73) throw new Error(`User account too small: ${data.length} bytes`);
  const view = data.subarray(8); // skip 8-byte Anchor discriminator

  const userIdHash = view.subarray(0, 32);  // [0..32)
  const roleU8 = view.readUInt8(32);        // byte 32
  const walletRaw = view.subarray(33, 65);  // [33..65)

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
  const info: AccountInfo<Buffer> | null = await connection.getAccountInfo(userPda);
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