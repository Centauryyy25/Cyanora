import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  // Keep Prisma adapter for Google OAuth users; Credentials will use JWT-only
  adapter: PrismaAdapter(prisma),
  // Use JWT sessions to avoid DB session dependency during development
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = creds?.email as string | undefined;
        const password = creds?.password as string | undefined;

        if (!email || !password) return null;

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          throw new Error("Supabase env missing: SUPABASE_URL/ANON_KEY");
        }

        const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          return null;
        }

        const data = await res.json();
        const sbUser = data?.user;
        if (!sbUser?.id) return null;

        // Ensure a Prisma user exists for this login (credentials)
        // Reuse existing by email, else create new with Supabase user id.
        // If Prisma is unavailable, fall back to Supabase user's data.
        let id = sbUser.id as string;
        let name = sbUser.user_metadata?.full_name ?? sbUser.email;
        let image = sbUser.user_metadata?.avatar_url ?? null;
        try {
          let dbUser = await prisma.user.findUnique({ where: { email: sbUser.email as string } });
          if (!dbUser) {
            try {
              dbUser = await prisma.user.create({
                data: { id, email: sbUser.email, name, image },
              });
            } catch {
              dbUser = await prisma.user.findUnique({ where: { email: sbUser.email as string } });
            }
          }
          if (dbUser) {
            id = dbUser.id;
            name = dbUser.name ?? name;
            image = dbUser.image ?? image;
          }
        } catch {
          // Ignore Prisma connectivity errors; continue with Supabase identity
        }

        return {
          id,
          email: sbUser.email,
          name,
          image,
          // Attach Supabase tokens for JWT callback
          supabaseAccessToken: data.access_token,
          supabaseRefreshToken: data.refresh_token,
          provider: "supabase",
        } as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Enforce single active session per user: remove old sessions before creating a new one
      try {
        if (user?.id) {
          await prisma.session.deleteMany({ where: { userId: user.id as string } });
        }
      } catch {}
      return true;
    },
    async jwt({ token, user }) {
      // On first sign in, merge basic ids
      if (user) {
        const u = user as any;
        token.sub = u.id ?? token.sub;
        if (u.supabaseAccessToken) {
          (token as any).supabaseAccessToken = u.supabaseAccessToken;
          (token as any).supabaseRefreshToken = u.supabaseRefreshToken;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token.sub as string) ?? (token as any).id;
      }
      // Expose Supabase access token if present
      (session as any).supabaseAccessToken = (token as any).supabaseAccessToken;
      return session;
    },
  },
};

// ✅ gunakan "handlers", bukan "authHandlers"
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
