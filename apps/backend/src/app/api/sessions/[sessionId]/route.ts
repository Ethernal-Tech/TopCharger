import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, badRequest, forbidden, options } from "@/lib/http";
import { requireDriverContext, requireHostContext } from "@/lib/authz";

export async function OPTIONS() { return options(); }

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const session = await prisma.chargingSession.findUnique({ where: { id: sessionId } });
  if (!session) return badRequest("Session not found");

  // allow driver owner or host owner to view
  const authHeader = req.headers.get("authorization") || "";
  const scope = new URL(req.url).searchParams.get("scope");

  try {
    if (scope === "host") {
      const { host } = await requireHostContext(req);
      if (session.hostId !== host.userId) return forbidden("Not your charger");
      return ok({ session });
    } else {
      const { userId } = await requireDriverContext(req);
      if (session.driverId !== userId) return forbidden("Not your session");
      return ok({ session });
    }
  } catch (e: any) {
    if (e?.status === 403) return new Response(e.message, { status: 403 });
    throw e;
  }
}
