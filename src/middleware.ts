import { NextRequest, NextResponse } from "next/server";
import { verifyAppJWT } from "@/lib/jwt";

// Security headers (CSP tuned for Next.js + Supabase; adjust per deploy)
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "connect-src 'self' https://*.supabase.co https://www.googleapis.com",
  "form-action 'self'",
].join("; ");

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // Allow auth pages without checks
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort()"
    );
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    return res;
  }

  // Validate custom JWT (app_session)
  const token = req.cookies.get("app_session")?.value;
  let isAuthed = false;
  if (token) {
    try {
      await verifyAppJWT(token);
      isAuthed = true;
    } catch {
      isAuthed = false;
    }
  }

  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/home");

  if (isProtected && !isAuthed) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
    const res = NextResponse.redirect(url);
    // Ensure stale cookie is cleared when redirecting
    res.cookies.set("app_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    res.headers.set("Content-Security-Policy", csp);
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    res.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort()"
    );
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    return res;
  }

  const res = NextResponse.next();
  // Add baseline security headers for all matched routes
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort()"
  );
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

// Match all HTML/page routes and our protected areas; exclude Next internals and static assets.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/home/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js|map)).*)",
  ],
};
