import { NextResponse } from "next/server";

export async function POST() {
  const resp = NextResponse.json({ ok: true }, { status: 200 });
  resp.cookies.set("app_session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0,
  });
  return resp;
}

