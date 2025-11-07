import { getServerSession } from "next-auth";
import { authOptions } from "../../[...nextauth]/route";
import { prisma } from "@/lib/db";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { SignJWT } from "jose";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

function verify(message: string, sigB58: string, pkB58: string) {
  const m = new TextEncoder().encode(message);
  return nacl.sign.detached.verify(m, bs58.decode(sigB58), bs58.decode(pkB58));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return corsResponse({ error: "Unauthorized" }, 401);

  const { publicKey, message, signature } = await req.json();
  if (!publicKey || !message || !signature)
    return corsResponse({ error: "Bad request" }, 400);

  if (!verify(message, signature, publicKey))
    return corsResponse({ error: "Invalid signature" }, 401);

  const existing = await prisma.account.findFirst({
    where: { provider: "solana", providerAccountId: publicKey },
    select: { userId: true },
  });

  if (existing && existing.userId !== session.user.id)
    return corsResponse({ error: "Wallet already linked to another account" }, 409);

  if (!existing)
    await prisma.account.create({
      data: { provider: "solana", providerAccountId: publicKey, type: "credentials", userId: session.user.id },
    });

  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret");
  const token = await new SignJWT({ uid: session.user.id, pub: publicKey })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("120s")
    .sign(secret);

  const res = corsResponse({ ok: true });
  res.cookies.set("tc_wallet_recent", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 120,
  });
  return res;
}
