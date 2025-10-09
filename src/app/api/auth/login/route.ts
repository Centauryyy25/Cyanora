import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { signAppJWT } from "@/lib/jwt";
// Note: Password comparison switched to plain-text at user request.
// For production, revert to bcrypt/argon2 verification.

type LoginBody = { email?: string; password?: string };

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const h = await headers();
    const ip = h.get("x-forwarded-for") || "local";
    const body = (await req.json()) as LoginBody;
    const identifierRaw = (body.email || "").trim();
    const identifierLower = identifierRaw.toLowerCase();
    const password = body.password || "";

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
      return NextResponse.json({ error: "Too many attempts, try later" }, { status: 429 });
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

    // Insecure plain-text password comparison to match DB as requested.
    // WARNING: Do not use this in production. Store and verify hashes instead.
    const dbPwd = String(user.password_hash ?? "");
    const ok = password === dbPwd;
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

    // Create JWT
    const token = await signAppJWT({
      sub: String(user.id),
      email: user.email,
      username: user.username,
      role: roleName,
      permissions,
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
    });

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
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });

    return resp;
  } catch (err: any) {
    console.error("/api/auth/login error:", err?.message || err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
