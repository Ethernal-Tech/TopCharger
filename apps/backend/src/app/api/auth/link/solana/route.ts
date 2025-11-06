import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/db";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { SignJWT } from "jose";

const ORIGIN = "http://localhost:5173";

function verify(message: string, sigB58: string, pkB58: string) {
  const m = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(m, bs58.decode(sigB58), bs58.decode(pkB58));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const { publicKey, message, signature } = await req.json();
  if (!publicKey || !message || !signature) {
    return new NextResponse(JSON.stringify({ error: "Bad request" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
  if (!verify(message, signature, publicKey)) {
    return new NextResponse(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const existing = await prisma.account.findFirst({
    where: { provider: "solana", providerAccountId: publicKey },
    select: { userId: true },
  });
  if (existing && existing.userId !== session.user.id) {
    return new NextResponse(
      JSON.stringify({ error: "Wallet already linked to another account" }),
      {
        status: 409,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": ORIGIN,
          "Access-Control-Allow-Credentials": "true",
        },
      }
    );
  }
  if (!existing) {
    await prisma.account.create({
      data: {
        provider: "solana",
        providerAccountId: publicKey,
        type: "credentials",
        userId: session.user.id,
      },
    });
  }

  // Issue a short-lived wallet session cookie (5 minutes)
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  const token = await new SignJWT({ uid: session.user.id, pub: publicKey })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(secret);

  const res = new NextResponse(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
    },
  });
  res.cookies.set("tc_wallet_recent", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5, // 5 minutes
    secure: false, // set true in production over HTTPS
  });
  return res;
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
  });
}
