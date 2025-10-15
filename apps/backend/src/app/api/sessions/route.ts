import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, options } from "@/lib/http";
import { requireDriverContext, requireHostContext } from "@/lib/authz";

export async function OPTIONS() { return options(); }

/**
 * GET /api/sessions?scope=driver|host&page=1&pageSize=20
 * scope=driver => list the authenticated driver's sessions
 * scope=host   => list sessions on authenticated host's chargers
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "driver").toLowerCase();
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(100, Number(url.searchParams.get("pageSize") || "20"));

  if (scope === "host") {
    const { host } = await requireHostContext(req);
    const [items, total] = await Promise.all([
      prisma.chargingSession.findMany({
        where: { hostId: host.userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chargingSession.count({ where: { hostId: host.userId } }),
    ]);
    return ok({ items, page, pageSize, total });
  } else {
    const { userId } = await requireDriverContext(req);
    const [items, total] = await Promise.all([
      prisma.chargingSession.findMany({
        where: { driverId: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chargingSession.count({ where: { driverId: userId } }),
    ]);
    return ok({ items, page, pageSize, total });
  }
}
