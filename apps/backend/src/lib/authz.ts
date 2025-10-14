import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";

export async function requireDriverContext(req: Request) {
  const userId = await requireUserId(req as any);
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) {
    throw Object.assign(new Error("Driver profile required"), { status: 403, name: "ForbiddenError" });
  }
  return { userId, driver };
}

export async function requireHostContext(req: Request) {
  const userId = await requireUserId(req as any);
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host) {
    throw Object.assign(new Error("Host profile required"), { status: 403, name: "ForbiddenError" });
  }
  return { userId, host };
}
