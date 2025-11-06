// apps/backend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

const FRONTEND = process.env.VITE_FRONTEND_URL || "http://localhost:5173";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/auth/signin",
  },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "id" in user) token.sub = String((user as { id: string }).id);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = String(token.sub);
      }
      if (token.sub) {
        const u = await prisma.user.findUnique({
          where: { id: String(token.sub) },
          select: { role: true },
        });
        session.user.role = u?.role ?? "UNSET";
      } else {
        session.user.role = "UNSET";
      }
      return session;
    },
    async redirect({ url }) {
      if (url.startsWith(FRONTEND)) return url;
      return `${FRONTEND}/auth/callback`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
