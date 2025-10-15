import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, ok, options } from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";

export async function OPTIONS() {
  return options();
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { userId } = await requireDriverContext(req as unknown as Request); // keep cast if requireUserId expects Request
    const { sessionId } = params;

    const session = await prisma.chargingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return badRequest("Session not found");

    if (session.driverId !== userId) return forbidden("Not your session");
    if (session.status !== "ACTIVE") return badRequest("Session is not ACTIVE");

    const now = new Date();
    const started = session.startedAt;
    const hours = Math.max(0, (now.getTime() - started.getTime()) / 3600000);

    const energyKwh = session.powerKwSnapshot * hours;
    const costTotal = energyKwh * session.pricePerKwhSnapshot;

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.chargingSession.update({
        where: { id: sessionId },
        data: {
          status: "STOPPED",
          stoppedAt: now,
          energyKwh,
          costTotal,
        },
      });
      await tx.charger.update({
        where: { id: session.chargerId },
        data: { available: true },
      });
      return s;
    });

    return ok({ session: updated });
  } catch (e: unknown) {
    const status = (e as { status?: number } | null)?.status;
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Internal Server Error";
    if (status === 403) return new Response(message, { status: 403 });
    console.error("POST /api/sessions/:id/stop failed:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
