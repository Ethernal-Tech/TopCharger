import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { jwtDecrypt } from "jose";  // for decrypting JWE

export async function requireUserId(req: NextRequest) {
  // 1) Cookie-based session (works when browser sends cookie)
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return session.user.id;

  // 2) Bearer token (compact JWE from /api/auth/token)
  const auth = req.headers.get("authorization") || "";
  const [, token] = auth.split(" ");
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
      const { payload } = await jwtDecrypt(token, secret); // <-- decrypt JWE
      if (payload?.sub) return String(payload.sub);
    } catch {
      // ignore and fall through
    }
  }

  throw new Response("Unauthorized", { status: 401 });
}
