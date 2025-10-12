import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAppJWT } from "@/lib/jwt";

function hasAdminPerm(perms?: unknown) {
  const p = Array.isArray(perms) ? (perms as string[]) : [];
  return p.includes("USER_CREATE") || p.includes("EMP_EDIT");
}

export async function GET(_: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("app_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyAppJWT(token);
    if (!hasAdminPerm((payload as any).permissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!supabaseAdmin) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const { data: sessions, error: sErr } = await supabaseAdmin
      .from("app_sessions")
      .select("jti,user_id,created_at,revoked_at")
      .order("created_at", { ascending: false });
    if (sErr) throw sErr;

    const ids = Array.from(new Set((sessions || []).map((s: any) => s.user_id))).filter(Boolean);
    let users: Record<string, any> = {};
    if (ids.length) {
      const { data: urows, error: uErr } = await supabaseAdmin
        .from("users")
        .select("id, username, email, role_id, roles(name)")
        .in("id", ids as any);
      if (uErr) throw uErr;
      for (const u of urows || []) {
        users[String((u as any).id)] = {
          id: (u as any).id,
          username: (u as any).username,
          email: (u as any).email,
          role: Array.isArray((u as any).roles) ? (u as any).roles?.[0]?.name ?? null : (u as any).roles?.name ?? null,
        };
      }
    }

    const data = (sessions || []).map((s: any) => ({
      jti: s.jti,
      created_at: s.created_at,
      revoked_at: s.revoked_at,
      user: users[String(s.user_id)] ?? { id: s.user_id },
    }));
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
