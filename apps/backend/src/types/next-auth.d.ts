import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      // role?: "HOST" | "DRIVER" | "ADMIN";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    // role?: "HOST" | "DRIVER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    // role?: "HOST" | "DRIVER" | "ADMIN";
  }
}
