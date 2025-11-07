import { randomBytes } from "crypto";

const ORIGIN = "http://localhost:5173";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  return new Response(JSON.stringify({ nonce }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
