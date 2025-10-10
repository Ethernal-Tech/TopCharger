import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { createVehicleSchema } from "@/lib/validation";
import { badRequest, created, forbidden, ok, options } from "@/lib/http";

export function OPTIONS() { return options(); }

// Create a new vehicle for the authenticated driver
export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);

  // Ensure the user has a DriverProfile
  const driver = await prisma.driverProfile.findUnique({ where: { userId } });
  if (!driver) return forbidden("Create driver profile first at /api/drivers/profile");

  const body = await req.json().catch(() => null);
  const parsed = createVehicleSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(issue?.message || "Invalid payload");
  }

  const { model, connector } = parsed.data;

  const vehicle = await prisma.vehicle.create({
    data: {
      driverId: userId,
      model,
      connector,
    },
  });

  return created({ vehicle });
}

// List my vehicles
export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);

  const vehicles = await prisma.vehicle.findMany({
    where: { driverId: userId },
    orderBy: { createdAt: "desc" },
  });

  return ok({ items: vehicles });
}
