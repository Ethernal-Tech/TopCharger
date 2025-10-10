import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" }, // <- use JWT-based sessions
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
      // Load role on first sign-in or when missing (tiny query; cached by session later)
      if (!("role" in token) && token.sub) {
        const u = await prisma.user.findUnique({
          where: { id: String(token.sub) },
          select: { role: true },
        });
        (token as any).role = u?.role ?? "UNSET";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = String(token.sub);
      (session.user as any).role = (token as any).role ?? "UNSET"; // <- expose role
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow redirect to your React frontend:
      if (url.startsWith("http://localhost:5173")) {
        return url;
      }
      // Default behavior – redirect to backend domain
      return baseUrl;
    },
  },
  // Optional: set your JWT secret explicitly (NextAuth will use NEXTAUTH_SECRET anyway)
  // jwt: { secret: process.env.NEXTAUTH_SECRET },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
