import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";
import { SignJWT } from "jose";
import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return corsResponse("Unauthorized", 401);

  const secret = new TextEncoder().encode(
    process.env.NEXTAUTH_SECRET || "dev-secret"
  );
  const token = await new SignJWT({ sub: session.user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  return corsResponse({ token });
}
