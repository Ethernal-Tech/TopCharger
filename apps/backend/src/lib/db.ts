// Uses the generated client at src/generated/prisma (per your schema.prisma "output")
import { PrismaClient } from "@/generated/prisma";

export const prisma =
  (globalThis as any).prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  (globalThis as any).prisma = prisma;
}
