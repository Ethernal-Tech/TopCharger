// apps/backend/src/app/api/auth/me/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

const ACAO = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:5173";
const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ACAO,
  "Access-Control-Allow-Credentials": "true",
  Vary: "Origin",
};

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: COMMON_HEADERS,
    });
  }

  // session.user now has walletSol (from callbacks.session)
  return new Response(JSON.stringify({ user: session.user }), {
    headers: COMMON_HEADERS,
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      ...COMMON_HEADERS,
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
