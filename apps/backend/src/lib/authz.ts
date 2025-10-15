import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import type { NextRequest } from "next/server";

type ForbiddenError = Error & { status?: number; name?: string };

function forbiddenError(msg: string): ForbiddenError {
  return Object.assign(new Error(msg), { status: 403, name: "ForbiddenError" });
}

export async function requireDriverContext(req: NextRequest) {
  const userId = await requireUserId(req);
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    throw forbiddenError("Driver profile required");
  }
  return { userId, driver };
}

export async function requireHostContext(req: NextRequest) {
  const userId = await requireUserId(req);
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host) {
    throw forbiddenError("Host profile required");
  }
  return { userId, host };
}
