import { NextRequest, NextResponse } from "next/server";

// Delegate Google OAuth to NextAuth's built-in provider flow.
export async function GET(_: NextRequest) {
  // Redirect to NextAuth sign-in with provider=google
  return NextResponse.redirect(new URL("/api/auth/signin?provider=google", process.env.NEXTAUTH_URL || "http://localhost:3000"));
}
