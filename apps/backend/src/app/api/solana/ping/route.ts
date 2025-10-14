export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connection, payer } from "@/lib/solana";

export async function GET() {
  const [slot, balance] = await Promise.all([
    connection.getSlot("confirmed"),
    connection.getBalance(payer.publicKey),
  ]);

  return NextResponse.json({
    network: process.env.SOLANA_RPC_URL || "clusterApiUrl(devnet)",
    slot,
    payer: payer.publicKey.toBase58(),
    balanceLamports: balance,
  });
}
