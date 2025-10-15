// apps/backend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: '/auth/signin', // Specify your custom sign-in page route here
    signOut: '/auth/signout',
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
      // Keep only the user id (sub). No DB fetch here.
      if (user && "id" in user) token.sub = String((user as { id: string }).id);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = String(token.sub); // copy sub to session.user.id
      }
      // Always fetch the latest role from DB
      // good enough for MVP, be aware the DB hit on every session call
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("http://localhost:5173")) return url;
      return baseUrl;
    },
  },
  // jwt: { secret: process.env.NEXTAUTH_SECRET },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
