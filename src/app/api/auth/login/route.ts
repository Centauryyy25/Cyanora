import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { signAppJWT } from "@/lib/jwt";
import { z } from "zod";
import bcrypt from "bcryptjs";
// Note: Password comparison switched to plain-text at user request.
// For production, revert to bcrypt/argon2 verification.

type LoginBody = { email?: string; password?: string };

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const h = await headers();
    const ip = h.get("x-forwarded-for") || "local";
    const schema = z.object({
      email: z.string().trim().min(3).max(200),
      password: z.string().min(1).max(200),
    });
    const json = (await req.json()) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const identifierRaw = parsed.data.email.trim();
    const identifierLower = identifierRaw.toLowerCase();
    const password = parsed.data.password;

    if (!identifierRaw || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // CSRF double-submit token check
    const cookieStore = await cookies();
    const csrfCookie = cookieStore.get("csrf_token")?.value;
    const csrfHeader = h.get("x-csrf-token");
    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      // Issue a token to allow client to retry safely next time
      const newToken = crypto.randomUUID();
      const resp = NextResponse.json({ error: "CSRF token missing or invalid" }, { status: 400 });
      resp.cookies.set("csrf_token", newToken, {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60,
      });
      return resp;
    }

    const rl = rateLimit(`login:${ip}:${identifierLower}`, 5, 60_000);
    if (!rl.ok) {
      const resp = NextResponse.json({ error: "Too many attempts, try later" }, { status: 429 });
      resp.headers.set("Retry-After", Math.ceil((rl.resetAt - Date.now()) / 1000).toString());
      return resp;
    }

    // Fetch user, role, and permissions
    const { data: user, error: uErr } = await supabaseAdmin
      .from("users")
      .select(`id, username, email, password_hash, role_id, status, last_login_at`)
      // allow login via email (case-insensitive) or username (exact)
      .or(`email.ilike.${identifierLower},username.eq.${identifierRaw}`)
      .maybeSingle();
    if (uErr) {
      console.error("/api/auth/login: users query error", uErr);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
    if (!user) {
      console.warn(`/api/auth/login: user not found for identifier=${identifierRaw}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if (user.status !== "ACTIVE") {
      return NextResponse.json({ error: "Account inactive" }, { status: 403 });
    }

    // Verify password: support bcrypt hashes and fallback to plain text
    const dbPwd = String(user.password_hash ?? "");
    let ok = false;
    try {
      if (dbPwd.startsWith("$2a$") || dbPwd.startsWith("$2b$") || dbPwd.startsWith("$2y$")) {
        ok = await bcrypt.compare(password, dbPwd);
      } else if (dbPwd.startsWith("$argon2")) {
        // Optional: add argon2 verification if package is present
        ok = false; // not supported here
      } else {
        // legacy/plain text fallback
        ok = password === dbPwd;
      }
    } catch {
      ok = false;
    }
    if (!ok) {
      console.warn(`/api/auth/login: password mismatch for user id=${user.id}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Load role name
    let roleName: string | null = null;
    if (user.role_id) {
      const { data: roleRow, error: rErr } = await supabaseAdmin
        .from("roles")
        .select("name")
        .eq("id", user.role_id)
        .single();
      if (rErr) {
        console.warn("/api/auth/login: roles query warning", rErr);
      } else {
        roleName = roleRow?.name ?? null;
      }
    }

    // Load permissions
    const { data: perms, error: pErr } = await supabaseAdmin
      .from("role_permissions")
      .select("allowed, permissions:permissions(code)")
      .eq("role_id", user.role_id);
    if (pErr) {
      console.error("/api/auth/login: perms query error", pErr);
    }
    const permissions = (perms || [])
      .filter((r: any) => r.allowed)
      .map((r: any) => r.permissions?.code)
      .filter(Boolean) as string[];

    // Load employee join
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select(
        `id, full_name, employment_status, department:departments(name), position:positions(title)`
      )
      .eq("user_id", user.id)
      .maybeSingle();

    // Safely flatten possible embedded arrays/objects from PostgREST
    const departmentName = emp
      ? (() => {
          const d = (emp as any).department;
          if (!d) return null;
          return Array.isArray(d) ? d[0]?.name ?? null : d.name ?? null;
        })()
      : null;
    const positionTitle = emp
      ? (() => {
          const p = (emp as any).position;
          if (!p) return null;
          return Array.isArray(p) ? p[0]?.title ?? null : p.title ?? null;
        })()
      : null;

    // Update last_login_at and log activity
    const nowIso = new Date().toISOString();
    await supabaseAdmin.from("users").update({ last_login_at: nowIso }).eq("id", user.id);
    await supabaseAdmin.from("activity_logs").insert({
      user_id: user.id,
      entity_type: "LOGIN",
      action: "LOGIN",
      description: "User login",
    });

    // Create JWT with JTI and persist single-session in DB (if table exists)
    const jti = crypto.randomUUID();
    try {
      // Revoke previous active sessions for this user
      await supabaseAdmin
        .from("app_sessions")
        .update({ revoked_at: nowIso })
        .eq("user_id", user.id)
        .is("revoked_at", null);
      // Insert current session record
      await supabaseAdmin.from("app_sessions").insert({
        jti,
        user_id: user.id,
        created_at: nowIso,
      } as any);
    } catch {}

    // Issue JWT with 1 hour expiry
    const token = await signAppJWT({
      sub: String(user.id),
      email: user.email,
      username: user.username,
      role: roleName,
      permissions,
      jti,
      employee: emp
        ? {
            id: (emp as any).id,
            full_name: (emp as any).full_name,
            department: departmentName,
            position: positionTitle,
            employment_status: (emp as any).employment_status ?? null,
          }
        : null,
      last_login_at: nowIso,
    }, 60 * 60);

    const resp = NextResponse.json({
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: roleName,
        permissions,
        employee: emp
          ? {
              full_name: (emp as any).full_name,
              department: departmentName,
              position: positionTitle,
              employment_status: (emp as any).employment_status ?? null,
            }
          : null,
        last_login_at: nowIso,
      },
    }, { status: 200 });

    resp.cookies.set("app_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1h absolute session
    });

    return resp;
  } catch (err: any) {
    console.error("/api/auth/login error:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
