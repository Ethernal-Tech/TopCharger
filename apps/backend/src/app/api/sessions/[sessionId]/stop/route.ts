import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, ok, options } from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";
import { sendConfirmCharge } from "@/lib/solana";

export async function OPTIONS() {
  return options();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { userId } = await requireDriverContext(req);
    const { sessionId } = await ctx.params;

    const session = await prisma.chargingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) return badRequest("Session not found");

    if (session.driverId !== userId) return forbidden("Not your session");
    if (session.status !== "ACTIVE") return badRequest("Session is not ACTIVE");

    const now = new Date();
    const hours = Math.max(
      0,
      (now.getTime() - session.startedAt.getTime()) / 3_600_000
    );

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

    // Best-effort Solana confirm
    if (session.solanaMatchPda) {
      try {
        if (updated.solanaMatchPda) {
          const charger = await prisma.charger.findUnique({
            where: { id: updated.chargerId },
            select: { solanaChargerPda: true },
          });
          if (charger?.solanaChargerPda) {
            const { signature } = await sendConfirmCharge({
              matchPda: updated.solanaMatchPda,
              chargerPda: charger.solanaChargerPda,
              wasCorrect: true, // MVP
            });

            await prisma.chargingSession.update({
              where: { id: updated.id },
              data: { stopTxSig: signature },
            });
          }
        }
      } catch (e) {
        console.error("confirm_charge failed:", e);
        // non-fatal for MVP
      }
    }

    return ok({
      session: updated,
      chainSync: "confirm_failed_or_missing_match_pda",
    });
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
