import { randomBytes } from "crypto";

export async function GET() {
  const nonce = randomBytes(16).toString("hex"); // 32-character hex string
  // TODO: persist nonce with TTL in DB/Redis (and mark-used on verify)
  return new Response(JSON.stringify({ nonce }), {
    headers: { "Content-Type": "application/json" },
  });
}