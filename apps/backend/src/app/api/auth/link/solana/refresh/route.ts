import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../../[...nextauth]/route";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const ORIGIN = "http://localhost:5173";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  const jar = await cookies();
  const c = jar.get("tc_wallet_recent")?.value;
  if (!c) {
    return new NextResponse("No wallet session", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }

  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
    const { payload } = await jwtVerify(c, secret);
    const uid = String(payload.uid);
    const pub = String(payload.pub);
    if (uid !== session.user.id) {
      return new NextResponse("Mismatch", {
        status: 401,
        headers: {
          "Access-Control-Allow-Origin": ORIGIN,
          "Access-Control-Allow-Credentials": "true",
        },
      });
    }
    return new NextResponse(JSON.stringify({ ok: true, publicKey: pub }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
        Vary: "Cookie",
      },
    });
  } catch {
    return new NextResponse("Expired", {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": ORIGIN,
        "Access-Control-Allow-Credentials": "true",
      },
    });
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
    },
  });
}
