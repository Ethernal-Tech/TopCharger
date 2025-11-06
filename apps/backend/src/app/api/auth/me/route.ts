import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/db";

const ORIGIN = process.env.FRONTEND_URL || "http://localhost:5173";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      accounts: {
        where: { provider: "solana" },
        select: { providerAccountId: true },
      },
    },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        wallets: user.accounts?.map((a) => a.providerAccountId) ?? [],
      },
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    }
  );
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
