// apps/backend/src/app/api/chargers/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, options } from "@/lib/http";
import type { Prisma, ConnectorType } from "@/generated/prisma"; // <- matches your generator output

// Type guard to keep TS happy and avoid `any`
function isConnectorType(v: string): v is ConnectorType {
  return (Object.values(ConnectorType) as string[]).includes(v);
}

// CORS preflight
export function OPTIONS() {
  return options();
}

// Public list of ALL chargers (paginated, newest first)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")), 100);

  // Optional simple filters
  const connectorParam = url.searchParams.get("connector"); // e.g. TYPE2
  const availableParam = url.searchParams.get("available"); // "true" | "false" | null

  const where: Prisma.ChargerWhereInput = {};

  if (connectorParam && isConnectorType(connectorParam)) {
    where.connector = connectorParam; // typed as ConnectorType
  }

  if (availableParam === "true") where.available = true;
  if (availableParam === "false") where.available = false;

  const [items, total] = await Promise.all([
    prisma.charger.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.charger.count({ where }),
  ]);

  return ok({ items, page, pageSize, total });
}
