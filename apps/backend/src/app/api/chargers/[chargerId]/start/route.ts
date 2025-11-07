import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  badRequest,
  forbidden,
  created,
  options,
  unauthorized,
} from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";
import { sendReserveCharger, hash32 } from "@/lib/solana";

export async function OPTIONS() {
  return options();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ chargerId: string }> } // keep params as Promise
) {
  try {
    const { userId, driver } = await requireDriverContext(req);
    const { chargerId } = await ctx.params; // await before using params

    if (!chargerId) return badRequest("Missing chargerId");

    const charger = await prisma.charger.findUnique({
      where: { id: chargerId },
    });
    if (!charger) return badRequest("Charger not found");
    if (!charger.available) return forbidden("Charger not available (in use)");

    // Prevent double-active sessions
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

    // Snapshots with safe defaults
    const pricePerKwhSnap = Number(charger.pricePerKwh ?? 0);
    const powerKwSnap = Number(charger.powerKw ?? 0);

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.chargingSession.create({
        data: {
          driverId: driver.userId,
          chargerId,
          hostId: charger.hostId,
          status: "ACTIVE",
          pricePerKwhSnapshot: pricePerKwhSnap,
          powerKwSnapshot: powerKwSnap,
          connectorSnapshot: charger.connector,
          chargerNameSnapshot: charger.name,
        },
      });
      await tx.charger.update({
        where: { id: chargerId },
        data: { available: false },
      });
      return s;
    });

    // Best-effort on-chain reservation (non-fatal)
    if (charger.solanaChargerPda) {
      try {
        const matchId32 = hash32(session.id);
        const { signature, matchPda } = await sendReserveCharger({
          backendUserId: userId,
          chargerPda: charger.solanaChargerPda,
          matchId32,
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
        // proceed without chain data
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
    if (status === 401) return unauthorized();
    if (status === 403) return forbidden(String(message || "Forbidden"));
    console.error("POST /api/chargers/:id/start failed:", e);
    return badRequest(message);
  }
}
