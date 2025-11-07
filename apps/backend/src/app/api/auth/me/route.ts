import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { prisma } from "@/lib/db";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return corsResponse("Unauthorized", 401);

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

  if (!user) return corsResponse("Unauthorized", 401);

  return corsResponse({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      wallets: user.accounts?.map((a) => a.providerAccountId) ?? [],
    },
  });
}
