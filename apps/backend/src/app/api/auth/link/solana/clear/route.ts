import { corsResponse, corsOptions } from "@/lib/cors";

export async function OPTIONS() {
  return corsOptions();
}

export async function POST() {
  const res = corsResponse({ ok: true });
  res.cookies.set({
    name: "tc_wallet_recent",
    value: "",
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return res;
}

export const DELETE = POST;
