import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ✅ normalized for Next.js 15
export async function POST(_: NextRequest) {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const res = NextResponse.redirect(new URL("/login", base));
  try {
    // Revoke current JTI if present
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("app_session")?.value;
      if (token && supabaseAdmin) {
        const payload = await verifyAppJWT(token);
        if (payload?.jti) {
          await supabaseAdmin
            .from("app_sessions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("jti", payload.jti as any);
        }
      }
    } catch {}
    // Remove custom app_session and CSRF helper
    res.cookies.set("app_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set("csrf_token", "", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });

    // Do not clear NextAuth cookies here; let next-auth/react signOut handle CSRF/session correctly.
  } catch {}
  return res;
}

// ✅ normalized for Next.js 15
export async function GET(_: NextRequest) {
  const res = NextResponse.redirect("/login");
  try {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("app_session")?.value;
      if (token && supabaseAdmin) {
        const payload = await verifyAppJWT(token);
        if (payload?.jti) {
          await supabaseAdmin
            .from("app_sessions")
            .update({ revoked_at: new Date().toISOString() })
            .eq("jti", payload.jti as any);
        }
      }
    } catch {}
    res.cookies.set("app_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    res.cookies.set("csrf_token", "", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  } catch {}
  return res;
}
