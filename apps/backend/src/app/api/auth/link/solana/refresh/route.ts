import { getServerSession } from "next-auth";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { authOptions } from "../../../[...nextauth]/route";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return corsResponse("Unauthorized", 401);

  const jar = await cookies();
  const c = jar.get("tc_wallet_recent")?.value;
  if (!c) return corsResponse(null, 204);

  try {
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || "dev-secret"
    );
    const { payload } = await jwtVerify(c, secret, { clockTolerance: 10 });

    if (String(payload.uid) !== session.user.id)
      return corsResponse("Mismatch", 401);

    return corsResponse({ ok: true, publicKey: payload.pub });
  } catch {
    return corsResponse("Expired", 401);
  }
}
