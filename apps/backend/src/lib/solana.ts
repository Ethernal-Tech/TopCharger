import { Connection, Keypair, clusterApiUrl, PublicKey, TransactionInstruction, Transaction, SystemProgram } from "@solana/web3.js";
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
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
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

export async function sendSessionTx(_kind: SolanaTxKind, _args: { sessionId: string }) : Promise<SolanaTxResult> {
  // Placeholder for later:
  // 1) load payer
  // 2) build instruction(s)
  // 3) send & confirm
  return { signature: "SIMULATED_SIG" };
}

// Map your app roles to a compact u8 value used by the program
function roleToU8(role: "HOST" | "DRIVER" | "UNSET" | "ADMIN"): number {
  switch (role) {
    case "HOST": return 1;
    case "DRIVER": return 2;
    case "ADMIN": return 3;
    case "UNSET":
    default: return 0;
  }
}

function hashUserIdTo32(userId: string): Buffer {
  // Deterministic 32-byte hash
  return crypto.createHash("sha256").update(userId, "utf8").digest().subarray(0, 32);
}

/**
 * Register a user on-chain (devnet) via Anchor-compatible flow.
 * Returns { signature, userPda }.
 * Idempotent at the PDA level (your program should no-op if already initialized).
 */
export async function registerUserOnChain(userId: string, role: "HOST" | "DRIVER" | "UNSET" | "ADMIN") {
  // Anchor dynamic import (keeps workspace resolution lazy)
  const anchor: any = await import("@coral-xyz/anchor");

  // Find Anchor.toml / IDL, default to repo root/target/idl
  const probableProgramRoot = path.resolve(__dirname, "..", ".."); // adjust if needed
  const anchorTomlPath = path.join(probableProgramRoot, "Anchor.toml");
  if (fs.existsSync(anchorTomlPath)) process.chdir(probableProgramRoot);

  const idl = require(path.join(process.cwd(), "target", "idl", "topcharger_program.json"));
  const programId = new PublicKey(
    process.env.TOPCHARGER_PROGRAM_ID ?? idl.metadata?.address ?? (idl.address as string)
  );

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider: any = anchor.getProvider();

  const roleU8 = roleToU8(role);
  const userHash = hashUserIdTo32(userId);

  // Don’t await the sync call—it returns [PublicKey, bump] immediately.
  const [userPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("user"), userHash], // Array<Buffer | Uint8Array>
  programId
);

  // Build instruction data from IDL discriminator + args (u8 + [u8;32])
  const ixDesc = idl.instructions.find((ix: any) => ix.name === "register_user");
  if (!ixDesc) throw new Error("register_user instruction not found in IDL");
  const discriminator = Buffer.from(ixDesc.discriminator);
  const argsBuf = Buffer.concat([Buffer.from([roleU8 & 0xff]), userHash]);
  const data = Buffer.concat([discriminator, argsBuf]);

  const keys = [
    { pubkey: userPda, isSigner: false, isWritable: true },
    { pubkey: provider.wallet.publicKey, isSigner: false, isWritable: false }, // authority
    { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },   // payer
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new TransactionInstruction({ programId, keys, data });

  // Build/send
  const tx = new Transaction().add(ix);
  tx.feePayer = provider.wallet.publicKey;

  const latest = await provider.connection.getLatestBlockhash();
  tx.recentBlockhash = latest.blockhash;

  const signed = await provider.wallet.signTransaction(tx);
  const sig = await provider.connection.sendRawTransaction(signed.serialize());
  await provider.connection.confirmTransaction({
    signature: sig,
    blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight,
  });

  return { signature: sig as string, userPda: userPda.toBase58() };
}
