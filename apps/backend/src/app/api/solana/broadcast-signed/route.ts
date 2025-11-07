// apps/backend/src/app/api/solana/broadcast-signed/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { connection } from "@/lib/solana";
import { Transaction } from "@solana/web3.js";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

const ORIGIN = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

function cors(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", ORIGIN);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  return res;
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    // Auth (cookie session or bearer handled inside)
    const userId = await requireUserId(req);

    const payload = (await req.json().catch(() => ({}))) as {
      signedTxBase64?: string;
    };

    if (!payload?.signedTxBase64 || typeof payload.signedTxBase64 !== "string") {
      return cors(
        NextResponse.json({ error: "Missing signedTxBase64" }, { status: 400 })
      );
    }

    // Decode tx
    const raw = Buffer.from(payload.signedTxBase64, "base64");

    // Parse to inspect fields (feePayer etc.)
    let tx: Transaction;
    try {
      tx = Transaction.from(raw);
    } catch {
      return cors(
        NextResponse.json({ error: "Invalid transaction bytes" }, { status: 400 })
      );
    }

    // Lookup user's linked wallet (adjust selector to your schema if needed)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        accounts: {
          select: { provider: true, providerAccountId: true },
        },
      },
    });

    // Prefer a Solana provider account if present
    const linkedPk =
      user?.accounts?.find((a) => a.provider?.toLowerCase().includes("solana"))
        ?.providerAccountId || user?.accounts?.[0]?.providerAccountId || null;

    if (!linkedPk) {
      return cors(
        NextResponse.json(
          { error: "No linked wallet on account" },
          { status: 403 }
        )
      );
    }

    const feePayer = tx.feePayer ? tx.feePayer.toBase58() : null;
    if (!feePayer) {
      return cors(
        NextResponse.json(
          { error: "Transaction missing fee payer" },
          { status: 400 }
        )
      );
    }

    if (feePayer !== linkedPk) {
      return cors(
        NextResponse.json(
          { error: "Fee payer does not match your linked wallet" },
          { status: 403 }
        )
      );
    }

    // Broadcast
    const signature = await connection.sendRawTransaction(raw, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    // Confirm using non-deprecated shape
    const bh = await connection.getLatestBlockhash();
    const confirmation = await connection.confirmTransaction(
      { signature, ...bh },
      "confirmed"
    );

    const cluster = process.env.SOLANA_CLUSTER || "devnet";
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`;

    return cors(
      NextResponse.json(
        { ok: true, signature, explorerUrl, confirmation },
        { status: 200 }
      )
    );
  } catch (err: any) {
    console.error("broadcast-signed error:", err);
    return cors(
      NextResponse.json(
        { error: err?.message || "failed" },
        { status: 500 }
      )
    );
  }
}
