import { NextResponse } from "next/server";

const ORIGIN = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

// Clear the short-lived "recent wallet" cookie so UI won’t re-attach after logout.
export async function POST() {
  const res = new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
    },
  });

  // Delete cookie by setting empty + Max-Age=0 and same attributes you set when creating it
  res.cookies.set({
    name: "tc_wallet_recent",
    value: "",
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return res;
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
  });
}
