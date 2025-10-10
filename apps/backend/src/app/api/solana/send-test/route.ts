export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { connection, payer, clusterQueryParam } from "@/lib/solana";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

type SendTestBody = {
  to?: string;
  lamports?: number;
};

export async function POST(req: Request) {
  try {
    const raw = await req.json().catch(() => ({}));
    const body = (raw ?? {}) as Partial<SendTestBody>;

    const to = body.to ? new PublicKey(body.to) : payer.publicKey;
    const lamports =
      typeof body.lamports === "number" && Number.isFinite(body.lamports)
        ? body.lamports
        : 5000;

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

    return NextResponse.json({
      signature,
      explorerUrl,
      to: to.toBase58(),
      lamports,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
        ? err
        : "failed";
    console.error("send-test failed:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
