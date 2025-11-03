import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/db";
import nacl from "tweetnacl";
import bs58 from "bs58";

function verify(message: string, sigB58: string, pkB58: string) {
  const m = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(m, bs58.decode(sigB58), bs58.decode(pkB58));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { publicKey, message, signature } = await req.json();
  if (!publicKey || !message || !signature) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (!verify(message, signature, publicKey)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // TODO: validate nonce/domain/issuedAt; mark nonce used

  const existing = await prisma.account.findFirst({
    where: { provider: "solana", providerAccountId: publicKey },
    select: { userId: true },
  });
  if (existing && existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Wallet already linked to another account" }, { status: 409 });
  }
  if (!existing) {
    await prisma.account.create({
      data: { provider: "solana", providerAccountId: publicKey, type: "credentials", userId: session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
