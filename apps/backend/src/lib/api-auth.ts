import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { jwtVerify } from "jose";

// Try cookie session first; if absent, try Authorization Bearer
export async function requireUserId(req: Request) {
  // 1) cookie session (NextAuth)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return String((session.user as any).id);

  // 2) bearer token
  const auth = req.headers.get("authorization") || "";
  const [, token] = auth.split(" ");
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      if (payload?.sub) return String(payload.sub);
    } catch {
      // fall through
    }
  }

  throw new Response("Unauthorized", { status: 401 });
}
