import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createHostProfileSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api-auth";
import { badRequest, created, ok, options } from "@/lib/http";

export async function OPTIONS() { return options(); }

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  const body = await req.json().catch(() => null);
  const parse = createHostProfileSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.issues[0]?.message || "Invalid payload");

  const { businessName, bankAccountIban, bankAccountName } = parse.data;

  // Upsert profile, ensure role is HOST
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      role: "HOST",
      host: {
        upsert: {
          create: { businessName, bankAccountIban, bankAccountName },
          update: { businessName, bankAccountIban, bankAccountName },
        },
      },
    },
    include: { host: true },
  });

  return created({ userId: user.id, role: user.role, host: user.host });
}