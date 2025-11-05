import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ACAO = process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:5173";
const common = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": ACAO,
  "Access-Control-Allow-Credentials": "true",
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: common,
    });
  }

  const raw = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, raw: true });
  return new Response(JSON.stringify({ token: raw }), { headers: common });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      ...common,
      "Access-Control-Allow-Headers": "content-type, authorization",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
