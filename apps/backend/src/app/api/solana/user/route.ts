export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { ok, badRequest, notFound, options } from "@/lib/http";
import { fetchUserAccountByUserId } from "@/lib/solana";

export function OPTIONS() { return options(); }

/** GET /api/solana/user?userId=<backendUserId> */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return badRequest("Missing userId");

  try {
    const acc = await fetchUserAccountByUserId(userId);
    if (!acc) return notFound("User PDA not found");
    return ok(acc);
  } catch (e: any) {
    console.error("GET /api/solana/user failed:", e);
    return badRequest(e?.message || "Failed to fetch user PDA");
  }
}