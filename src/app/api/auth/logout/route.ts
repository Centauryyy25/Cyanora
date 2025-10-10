import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST() {
  const resp = NextResponse.json({ ok: true }, { status: 200 });
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
    resp.cookies.set("app_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    // Also clear legacy CSRF helper if set
    resp.cookies.set("csrf_token", "", {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  } catch {}
  return resp;
}

export async function GET() {
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
