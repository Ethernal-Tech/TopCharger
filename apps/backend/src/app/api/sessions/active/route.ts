import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireDriverContext, requireHostContext } from "@/lib/authz";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const scope = (url.searchParams.get("scope") || "driver").toLowerCase();

  if (scope === "host") {
    const { host } = await requireHostContext(req);
    const session = await prisma.chargingSession.findFirst({
      where: { hostId: host.userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
    return NextResponse.json({ id: session?.id ?? null });
  } else {
    const { userId } = await requireDriverContext(req);
    const session = await prisma.chargingSession.findFirst({
      where: { driverId: userId, status: "ACTIVE" },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
    return NextResponse.json({ id: session?.id ?? null });
  }
}
