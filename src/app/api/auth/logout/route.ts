import { NextResponse } from "next/server";

export async function POST() {
  const resp = NextResponse.json({ ok: true }, { status: 200 });
  try {
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
