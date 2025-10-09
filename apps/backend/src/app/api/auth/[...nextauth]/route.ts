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
  async jwt({ token, user }) {
    if (user && "id" in user) token.sub = String((user as { id: string }).id);
    return token;
  },
  async session({ session, token }) {
    if (session.user && token.sub) session.user.id = String(token.sub);
    return session;
},
}
,
  // Optional: set your JWT secret explicitly (NextAuth will use NEXTAUTH_SECRET anyway)
  // jwt: { secret: process.env.NEXTAUTH_SECRET },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
