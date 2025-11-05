import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/db";
import Credentials from "next-auth/providers/credentials";
import { Magic } from "@magic-sdk/admin";
import { Prisma } from "@/generated/prisma";

const FRONTEND = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:5173";
const magic = new Magic(process.env.MAGIC_SECRET_KEY || "");

export const authOptions: NextAuthOptions = {
  pages: { signIn: "/auth/signin", signOut: "/auth/signout" },
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "siws",
      name: "Sign in with Solana",
      credentials: { userId: { label: "User ID", type: "text" }, publicKey: { label: "Public Key", type: "text" } },
      async authorize(creds) {
        if (!creds?.userId || !creds?.publicKey) return null;
        const u = await prisma.user.findUnique({ where: { id: String(creds.userId) } });
        return u ? ({ id: String(u.id) } as any) : null;
      },
    }),
    Credentials({
      id: "magic",
      name: "Login with Email (Magic)",
      credentials: { did: { label: "DID Token", type: "text" } },
      async authorize(creds) {
        const TAG = "[auth:magic]";
        try {
          if (!process.env.MAGIC_SECRET_KEY) {
            console.error(`${TAG} Missing MAGIC_SECRET_KEY`);
            return null;
          }
          const did = creds?.did;
          if (!did) return null;

          try { magic.token.validate(did); } catch (e) {
            console.error(`${TAG} DID validation failed`, { error: e instanceof Error ? e.message : String(e) });
            return null;
          }

          let issuer: string | undefined, magicEmail: string | undefined;
          try {
            const meta = await magic.users.getMetadataByToken(did);
            issuer = meta.issuer ?? undefined;
            magicEmail = meta.email ?? undefined;
          } catch (e) {
            console.error(`${TAG} Magic metadata failed`, { error: e instanceof Error ? e.message : String(e) });
            return null;
          }
          if (!issuer) return null;

          const safeEmail = magicEmail ?? `${issuer}@magic.local`;

          // issuer -> fast path
          const byIssuer = await prisma.user.findUnique({ where: { magicIssuer: issuer }, select: { id: true } });
          if (byIssuer) return { id: String(byIssuer.id) } as any;

          // link by email if exists
          const byEmail = await prisma.user.findUnique({ where: { email: safeEmail }, select: { id: true } });
          if (byEmail) {
            const linked = await prisma.user.update({ where: { id: byEmail.id }, data: { magicIssuer: issuer }, select: { id: true } });
            return { id: String(linked.id) } as any;
          }

          // create new
          try {
            const created = await prisma.user.create({
              data: { magicIssuer: issuer, email: safeEmail },
              select: { id: true },
            });
            return { id: String(created.id) } as any;
          } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
              console.error(`${TAG} create prisma`, { code: e.code, message: e.message });
            } else {
              console.error(`${TAG} create`, { error: e instanceof Error ? e.message : String(e) });
            }
            return null;
          }
        } catch (e) {
          console.error(`[auth:magic] fatal`, { error: e instanceof Error ? e.message : String(e) });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && "id" in user) token.sub = String((user as { id: string }).id);
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = String(token.sub);
      if (token.sub) {
        const u = await prisma.user.findUnique({ where: { id: String(token.sub) }, select: { role: true, email: true, walletSol: true } });
        session.user.role = u?.role ?? "UNSET";
        if (u?.email) session.user.email = u.email;
        (session.user as any).walletSol = u?.walletSol ?? null;
      } else {
        session.user.role = "UNSET";
        (session.user as any).walletSol = null;
      }
      return session;
    },
    async redirect({ url }) {
      if (url.startsWith(FRONTEND)) return url;
      return `${FRONTEND}/auth/callback`;
    },
  },
  logger: {
    error(code, metadata) { console.error("[nextauth:error]", code, metadata); },
    warn(code) { console.warn("[nextauth:warn]", code); },
    // no debug
  },
  events: {
    async signIn(message) {
      const uid = message?.user?.id ?? "unknown";
      const provider = message?.account?.provider ?? "unknown";
      const isNew = (message as any)?.isNewUser;
      console.log(`[nextauth] signIn uid=${uid} provider=${provider} new=${isNew}`);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
