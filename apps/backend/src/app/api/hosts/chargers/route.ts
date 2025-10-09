import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { createChargerSchema } from "@/lib/validation";
import { badRequest, created, forbidden, ok, options } from "@/lib/http";

export async function OPTIONS() { return options(); }

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);

  // Must have a HostProfile
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host) return forbidden("Create host profile first at /api/hosts/profile");

  const body = await req.json().catch(() => null);
  const parse = createChargerSchema.safeParse(body);
  if (!parse.success) return badRequest(parse.error.issues[0]?.message || "Invalid payload");
  const { name, latitude, longitude, pricePerKwh, connector, available } = parse.data;

  const charger = await prisma.charger.create({
    data: {
      hostId: host.userId,
      name,
      latitude,
      longitude,
      pricePerKwh,
      connector,
      available: available ?? true,
    },
  });

  return created({ charger });
}

// list your chargers to verify creation
export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host) return forbidden("Create host profile first");

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(Number(url.searchParams.get("pageSize") ?? "20"), 100);

  const [items, total] = await Promise.all([
    prisma.charger.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.charger.count({ where: { hostId: userId } }),
  ]);

  return ok({ items, page, pageSize, total });
}
