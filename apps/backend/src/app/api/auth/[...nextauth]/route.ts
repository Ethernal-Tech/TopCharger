import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },  // <- use JWT-based sessions
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Put whatever you want into the token (runs at sign-in and on each session refresh)
    async jwt({ token, user }) {
      // When user logs in the first time, `user` is defined
      if (user) {
        token.sub = user.id as string;     // Prisma User id
        // token.role = (user as any).role; // if you want role inside JWT later
      }
      return token;
    },
    // Shape the session object returned by getServerSession (optional)
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        // (session.user as any).role = token.role;
      }
      return session;
    },
  },
  // Optional: set your JWT secret explicitly (NextAuth will use NEXTAUTH_SECRET anyway)
  // jwt: { secret: process.env.NEXTAUTH_SECRET },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
