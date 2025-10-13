import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, options } from "@/lib/http";

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
  const connector = url.searchParams.get("connector");     // e.g. TYPE2
  const available = url.searchParams.get("available");     // "true"/"false"

  const where: any = {};
  if (connector) where.connector = connector as any;
  if (available === "true")  where.available = true;
  if (available === "false") where.available = false;

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
