// apps/backend/src/app/api/drivers/profile/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { upsertDriverProfileSchema } from "@/lib/validation";
import { requireUserId } from "@/lib/api-auth";
import {
  ok,
  notFound,
  unauthorized,
  badRequest,
  created,
  options,
} from "@/lib/http";
import { registerUserOnChain } from "@/lib/solana";

export function OPTIONS() {
  return options();
}

function isUnauthorized(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const m = e as { status?: number; name?: string };
  return m.status === 401 || m.name === "UnauthorizedError";
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId(req);

    const body = await req.json().catch(() => null);
    const parsed = upsertDriverProfileSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return badRequest(issue?.message || "Invalid payload");
    }

    // Read current role
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // STRICT guard
    if (existing.role !== "UNSET" && existing.role !== "DRIVER") {
      return new Response(
        JSON.stringify({ error: "Role conflict: user is not a DRIVER" }),
        { status: 409 }
      );
    }

    // Upsert driver profile; set role=DRIVER only when currently UNSET
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        role: existing.role === "UNSET" ? "DRIVER" : undefined,
        driver: {
          upsert: {
            create: {
              fullName: parsed.data.fullName,
              phone: parsed.data.phone,
              solanaPubkey: parsed.data.solanaPubkey,
              preferredConnector: parsed.data.preferredConnector,
            },
            update: {
              fullName: parsed.data.fullName,
              phone: parsed.data.phone,
              solanaPubkey: parsed.data.solanaPubkey,
              preferredConnector: parsed.data.preferredConnector,
            },
          },
        },
      },
      include: { driver: true },
    });

    // Register on-chain only if never registered before
    if (!user.solanaUserPda) {
      try {
        const { signature, userPda } = await registerUserOnChain(
          user.id,
          "DRIVER"
        );
        await prisma.user.update({
          where: { id: user.id },
          data: {
            solanaUserPda: userPda,
            solanaRegisterTx: signature,
          },
        });
      } catch (e) {
        console.error("registerUserOnChain(DRIVER) failed:", e);
      }
    }

    return created({ userId, role: user.role, driver: user.driver });
  } catch (err: unknown) {
    if (isUnauthorized(err)) {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("POST /api/drivers/profile failed:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
// fetch driver profile
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId(req);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, driver: true },
    });

    if (!user?.driver) return notFound("No driver profile");
    return ok(user);
  } catch {
    return unauthorized();
  }
}
