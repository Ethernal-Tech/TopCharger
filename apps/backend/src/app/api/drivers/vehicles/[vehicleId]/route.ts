import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { badRequest, forbidden, notFound, ok, options } from "@/lib/http";
import { updateVehicleSchema, vehicleIdParamSchema } from "@/lib/validation";

export function OPTIONS() { return options(); }

// Update fields of my vehicle
export async function PATCH(req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const userId = await requireUserId(req);
  const vehicleId = vehicleIdParamSchema.parse(params.vehicleId);

  // Must own the vehicle
  const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!existing) return notFound("Vehicle not found");
  if (existing.driverId !== userId) return forbidden("Not your vehicle");

  const body = await req.json().catch(() => null);
  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return badRequest(issue?.message || "Invalid payload");
  }

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: parsed.data, // only model/connector
  });

  return ok({ vehicle: updated });
}

// Delete my vehicle
export async function DELETE(req: NextRequest, { params }: { params: { vehicleId: string } }) {
  const userId = await requireUserId(req);
  const vehicleId = vehicleIdParamSchema.parse(params.vehicleId);

  const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!existing) return notFound("Vehicle not found");
  if (existing.driverId !== userId) return forbidden("Not your vehicle");

  await prisma.vehicle.delete({ where: { id: vehicleId } });
  return ok({ ok: true });
}
