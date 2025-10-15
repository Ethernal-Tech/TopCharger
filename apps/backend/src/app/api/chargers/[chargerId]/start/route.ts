import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, created, options } from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";
import { sendReserveCharger } from "@/lib/solana";

export async function OPTIONS() {
  return options();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ chargerId: string }> } // params is a Promise
) {
  try {
    const { userId, driver } = await requireDriverContext(req);
     const { chargerId } = await ctx.params; // await before using params

    const charger = await prisma.charger.findUnique({
      where: { id: chargerId },
    });
    if (!charger) return badRequest("Charger not found");
    if (!charger.available) return forbidden("Charger not available (in use)");

    const [driverActive, chargerActive] = await Promise.all([
      prisma.chargingSession.findFirst({
        where: { driverId: userId, status: "ACTIVE" },
      }),
      prisma.chargingSession.findFirst({
        where: { chargerId, status: "ACTIVE" },
      }),
    ]);
    if (driverActive) return forbidden("Driver already has an active session");
    if (chargerActive)
      return forbidden("Charger already has an active session");

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.chargingSession.create({
        data: {
          driverId: driver.userId,
          chargerId,
          hostId: charger.hostId,
          status: "ACTIVE",
          pricePerKwhSnapshot: charger.pricePerKwh,
          powerKwSnapshot: charger.powerKw,
          connectorSnapshot: charger.connector,
        },
      });
      await tx.charger.update({
        where: { id: chargerId },
        data: { available: false },
      });
      return s;
    });

    // Best-effort Solana reserve
    if (charger.solanaChargerPda) {
      try {
        const { signature, matchPda } = await sendReserveCharger({
          backendUserId: userId,
          chargerPda: charger.solanaChargerPda,
        });
        await prisma.chargingSession.update({
          where: { id: session.id },
          data: { startTxSig: signature, solanaMatchPda: matchPda },
        });
        return created({
          session: {
            ...session,
            startTxSig: signature,
            solanaMatchPda: matchPda,
          },
        });
      } catch (e) {
        console.error("reserve_charger failed:", e);
        // do not fail the session creation
      }
    }

    return created({ session });
  } catch (e: unknown) {
    const status = (e as { status?: number } | null)?.status;
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Internal Server Error";
    if (status === 403) return new Response(String(message), { status: 403 });
    console.error("POST /api/chargers/:id/start failed:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
