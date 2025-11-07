import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/db";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return corsResponse({ error: "Unauthorized" }, 401);

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id, provider: "solana" },
    select: { providerAccountId: true },
  });

  return corsResponse({ wallets: accounts.map((a) => a.providerAccountId) });
}
