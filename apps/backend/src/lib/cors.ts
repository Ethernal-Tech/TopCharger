// apps/backend/src/lib/cors.ts
import { NextResponse } from "next/server";

export const ORIGIN =
  process.env.VITE_FRONTEND_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

export const baseHeaders = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "content-type, authorization",
  "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  Vary: "Origin, Cookie",
};

export function corsResponse(body?: any, status: number = 200) {
  return new NextResponse(
    body ? JSON.stringify(body) : null,
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...baseHeaders,
      },
    }
  );
}

export function corsOptions() {
  return new NextResponse(null, {
    headers: baseHeaders,
  });
}
