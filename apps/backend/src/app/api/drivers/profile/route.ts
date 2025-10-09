import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { upsertDriverProfileSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api-auth";
import { badRequest, created, ok, options, forbidden } from "@/lib/http";

export function OPTIONS() {
  return options();
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);

  const body = await req.json().catch(() => null);
  const parsed = upsertDriverProfileSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(issue?.message || "Invalid payload");
  }

  // Read current role
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!existing) return forbidden("User not found");

  // Upsert driver profile
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      // Set role to DRIVER only if user is not already HOST/ADMIN
      role: existing.role === "HOST" || existing.role === "ADMIN" ? undefined : "DRIVER",
      driver: {
        upsert: {
          create: {
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            solanaPubkey: parsed.data.solanaPubkey,
            preferredConnector: parsed.data.preferredConnector,
          },
          update: {
            fullName: parsed.data.fullName,
            phone: parsed.data.phone,
            solanaPubkey: parsed.data.solanaPubkey,
            preferredConnector: parsed.data.preferredConnector,
          },
        },
      },
    },
    include: { driver: true },
  });

  return created({
    userId: userId,
    role: user.role,
    driver: user.driver,
  });
}
