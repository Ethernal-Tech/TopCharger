// apps/backend/src/app/api/auth/token/route.ts
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Returns the current NextAuth JWT (requires you're signed in via cookie)
export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new Response("Unauthorized", { status: 401 });

  // Return a compact JWT string for the SPA
  const raw = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });

  return new Response(JSON.stringify({ token: raw }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:5173",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
