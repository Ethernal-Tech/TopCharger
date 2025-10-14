// apps/backend/src/types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

export type Role = "UNSET" | "HOST" | "DRIVER" | "ADMIN";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role; // required in session (you always set a value)
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: Role; // Prisma User has a role column
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    role?: Role; // optional on first run, filled in jwt() callback
  }
}
