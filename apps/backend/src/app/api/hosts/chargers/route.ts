import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/api-auth";
import { createChargerSchema } from "@/lib/validation";
import { badRequest, created, forbidden, ok, options } from "@/lib/http";
import { createChargerOnChain, hashToU64 } from "@/lib/solana";
import type { ConnectorType } from "@/generated/prisma";


const CONNECTOR_DEFAULT_POWER_KW: Record<ConnectorType, number> = {
  TYPE2: 22,
  CCS2: 150,
  CHADEMO: 50,
  CCS1: 150,
  NEMA14_50: 9,
  SCHUKO: 3,
};

export async function OPTIONS() {
  return options();
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId(req);

  // Must have a HostProfile
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host)
    return forbidden("Create host profile first at /api/hosts/profile");

  const body = await req.json().catch(() => null);
  const parse = createChargerSchema.safeParse(body);
  if (!parse.success)
    return badRequest(parse.error.issues[0]?.message || "Invalid payload");
  const { name, latitude, longitude, pricePerKwh, connector, available } =
    parse.data;

  // Create in DB
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

  // Compute chainId (from cuid)
  const chainId = hashToU64(charger.id);

  // Call on-chain (non-fatal on failure)
  try {
    // Convert units
    const powerKw = CONNECTOR_DEFAULT_POWER_KW[connector]; // connector comes from validated payload
    const priceMicrousd = BigInt(Math.round(pricePerKwh * 1_000_000));
    const supplyType = 0; // MVP: 0 = renewable (or whatever you choose)

    const { signature, chargerPda } = await createChargerOnChain({
      backendUserId: userId,
      chargerIdU64: chainId,
      powerKw: Math.round(powerKw),
      supplyType,
      priceMicrousdPerKwh: priceMicrousd,
    });

    await prisma.charger.update({
      where: { id: charger.id },
      data: {
        solanaChargerPda: chargerPda,
        solanaCreateTx: signature,
      },
    });

    // include on-chain fields in response
    return created({
      charger: {
        ...charger,
        solanaChargerPda: chargerPda,
        solanaCreateTx: signature,
      },
    });
  } catch (e) {
    console.error("createChargerOnChain failed:", e);
    // Non-fatal for MVP — return web2 charger; front-end can retry a "sync to chain" later
    return created({ charger, chainSync: "failed" });
  }
}

// list your chargers to verify creation
export async function GET(req: NextRequest) {
  const userId = await requireUserId(req);
  const host = await prisma.hostProfile.findUnique({ where: { userId } });
  if (!host) return forbidden("Create host profile first");

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Math.min(
    Number(url.searchParams.get("pageSize") ?? "20"),
    100
  );

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
