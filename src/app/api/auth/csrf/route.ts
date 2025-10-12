import { NextRequest, NextResponse } from "next/server";

// ✅ normalized for Next.js 15
export async function GET(_: NextRequest) {
  const token = crypto.randomUUID();
  const res = NextResponse.json({ token });
  res.cookies.set("csrf_token", token, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60, // 1 hour
  });
  return res;
}
