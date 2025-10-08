import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";
import GoogleProvider from "next-auth/providers/google";


// Bungkus GET & POST agar cocok dengan signature Next.js 15
export async function GET(req: NextRequest) {
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  return handlers.POST(req);
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          code_challenge_method: undefined, // 🔧 fix PKCE error
        } as any,
      },
    }),
  ],
};
