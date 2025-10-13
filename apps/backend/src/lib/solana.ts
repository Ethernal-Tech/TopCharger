import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import bs58 from "bs58";
import fs from "node:fs";

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
