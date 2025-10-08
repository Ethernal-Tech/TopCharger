import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;              // we add this in callbacks.session
      // role?: "HOST" | "DRIVER" | "ADMIN"; // optional, if you add it later
    } & DefaultSession["user"];
  }

  // If you also put data in the JWT, reflect it here (optional for now)
  interface User {
    id: string;
    // role?: "HOST" | "DRIVER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;              // NextAuth sets this to user id
    // role?: "HOST" | "DRIVER" | "ADMIN";
  }
}
