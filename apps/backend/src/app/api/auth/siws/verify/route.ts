import nacl from "tweetnacl";
import bs58 from "bs58";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function verifySig(message: string, sigB58: string, pubB58: string) {
  const enc = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(enc, bs58.decode(sigB58), bs58.decode(pubB58));
}

export async function POST(req: Request) {
  const { publicKey, message, signature } = await req.json();
  if (!publicKey || !message || !signature) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // 1) Verify signature bytes
  if (!verifySig(message, signature, publicKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 2) Parse and validate SIWS fields (domain, nonce, issuedAt) from message string
  // TODO: enforce domain == your FRONTEND host; check nonce TTL & single-use

  // 3) Find or create account
  let account = await prisma.account.findFirst({
    where: { provider: "solana", providerAccountId: publicKey },
    include: { user: true },
  });

  let user = account?.user;
  if (!user) {
    user = await prisma.user.create({ data: { email: `${publicKey}@wallet.local` } }); // placeholder email is fine
    await prisma.account.create({
      data: {
        provider: "solana",
        providerAccountId: publicKey,
        type: "credentials",
        userId: user.id,
      },
    });
  }

  return NextResponse.json({ ok: true, userId: user.id, publicKey });
}