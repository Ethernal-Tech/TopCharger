import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireDriverContext, requireHostContext } from "@/lib/authz";
import { ok, options } from "@/lib/http";

export async function OPTIONS() { return options(); }

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "driver").toLowerCase();

  if (scope === "host") {
    const { host } = await requireHostContext(req);
    const session = await prisma.chargingSession.findFirst({
      where: { hostId: host.userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        chargerId: true,
        chargerNameSnapshot: true,
        driverId: true,
        hostId: true,
        startedAt: true,
      },
    });
    return ok(session);
  } else {
    const { userId } = await requireDriverContext(req);
    const session = await prisma.chargingSession.findFirst({
      where: { driverId: userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      select: {
        id: true,
        chargerId: true,
        chargerNameSnapshot: true,
        driverId: true,
        hostId: true,
        startedAt: true,
      },
    });
    return ok(session);
  }
}
