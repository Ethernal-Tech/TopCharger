import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, ok, options, unauthorized } from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";
import { sendConfirmCharge } from "@/lib/solana";

export async function OPTIONS() {
  return options();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> } // keep params as Promise
) {
  try {
    const { userId } = await requireDriverContext(req);
    const { sessionId } = await ctx.params; // await before using params

    if (!sessionId) return badRequest("Missing sessionId");

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

    const powerKw = Number(session.powerKwSnapshot ?? 0);
    const pricePerKwh = Number(session.pricePerKwhSnapshot ?? 0);

    const energyKwh = powerKw * hours;
    const costTotal = energyKwh * pricePerKwh;

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

    // Best-effort on-chain confirm (non-fatal)
    let chainSync = "confirm_skipped";
    if (session.solanaMatchPda) {
      try {
        const charger = await prisma.charger.findUnique({
          where: { id: updated.chargerId },
          select: { solanaChargerPda: true },
        });

        if (charger?.solanaChargerPda && updated.solanaMatchPda) {
          const { signature } = await sendConfirmCharge({
            matchPda: updated.solanaMatchPda,
            chargerPda: charger.solanaChargerPda,
            wasCorrect: true, // MVP
          });

          await prisma.chargingSession.update({
            where: { id: updated.id },
            data: { stopTxSig: signature },
          });

          chainSync = "confirm_ok";
        } else {
          chainSync = "confirm_missing_match_or_charger_pda";
        }
      } catch (e) {
        console.error("confirm_charge failed:", e);
        chainSync = "confirm_failed";
      }
    }

    return ok({ session: updated, chainSync });
  } catch (e: unknown) {
    const status = (e as { status?: number } | null)?.status;
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Internal Server Error";
    if (status === 401) return unauthorized();
    if (status === 403) return forbidden(String(message || "Forbidden"));
    console.error("POST /api/sessions/:id/stop failed:", e);
    return badRequest(message);
  }
}
