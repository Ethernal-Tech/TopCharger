export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connection, payer, clusterQueryParam } from "@/lib/solana";
import { PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const to = body?.to ? new PublicKey(body.to) : payer.publicKey;
    const lamports = Number.isFinite(body?.lamports) ? body.lamports : 5000;

    const ix = SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: to,
      lamports,
    });

    const tx = new Transaction().add(ix);
    const signature = await sendAndConfirmTransaction(connection, tx, [payer], {
      commitment: "confirmed",
    });

    const cluster = clusterQueryParam();
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;

    return NextResponse.json({ signature, explorerUrl, to: to.toBase58(), lamports });
  } catch (err: any) {
    console.error("send-test failed:", err);
    return NextResponse.json({ error: err?.message || "failed" }, { status: 500 });
  }
}
