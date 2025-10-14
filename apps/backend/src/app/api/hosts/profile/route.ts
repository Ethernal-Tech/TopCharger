import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createHostProfileSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api-auth";
import {
  badRequest,
  created,
  options,
  ok,
  notFound,
  unauthorized,
} from "@/lib/http";

export async function OPTIONS() {
  return options();
}

// apps/backend/src/app/api/hosts/profile/route.ts
export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);
  const body = await req.json().catch(() => null);
  const parse = createHostProfileSchema.safeParse(body);
  if (!parse.success)
    return badRequest(parse.error.issues[0]?.message || "Invalid payload");

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!existing) return badRequest("User not found");

  if (existing.role !== "UNSET" && existing.role !== "HOST") {
    return new Response(
      JSON.stringify({ error: "Role conflict: user is not a HOST" }),
      { status: 409 }
    );
  }

  const { businessName, bankAccountIban, bankAccountName } = parse.data;

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
// fetch host profile
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, host: true },
    });

    if (!user?.host) return notFound("No host profile");
    return ok(user);
  } catch {
    return unauthorized();
  }
}
