import { getServerSession } from "next-auth";
import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { authOptions } from "../../../[...nextauth]/route";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

const WALLET_SESSION_SECS = 300; // keep in sync with link route

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

    const uid = String(payload.uid);
    const pub = String(payload.pub);

    // Slide the window: mint a fresh short-lived token and set cookie again
    const newToken = await new SignJWT({ uid, pub })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${WALLET_SESSION_SECS}s`)
      .sign(secret);

    const res = corsResponse({ ok: true, publicKey: pub });
    res.cookies.set("tc_wallet_recent", newToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      path: "/",
      maxAge: WALLET_SESSION_SECS,
    });
    return res;
  } catch {
    return corsResponse("Expired", 401);
  }
}
