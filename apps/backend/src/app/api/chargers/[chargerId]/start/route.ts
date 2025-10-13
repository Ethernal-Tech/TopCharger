import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, created, options } from "@/lib/http";
import { requireDriverContext } from "@/lib/authz";

export async function OPTIONS() { return options(); }

export async function POST(
  req: NextRequest,
  context: { params: { chargerId: string } }
) {
  try {
    const { userId, driver } = await requireDriverContext(req);
    const { chargerId } = context.params;

    const charger = await prisma.charger.findUnique({ where: { id: chargerId } });
    if (!charger) return badRequest("Charger not found");
    if (!charger.available) return forbidden("Charger not available (in use)");

    // enforce single-active-session per driver and charger (MVP: application level)
    const [driverActive, chargerActive] = await Promise.all([
      prisma.chargingSession.findFirst({ where: { driverId: userId, status: "ACTIVE" } }),
      prisma.chargingSession.findFirst({ where: { chargerId, status: "ACTIVE" } }),
    ]);
    if (driverActive) return forbidden("Driver already has an active session");
    if (chargerActive) return forbidden("Charger already has an active session");

    // create session and mark charger unavailable
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

    return created({ session });
  } catch (e: any) {
    if (e?.status === 403) return new Response(e.message, { status: 403 });
    console.error("POST /api/chargers/:id/start failed:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
