import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAppJWT } from "@/lib/jwt";

function hasAdminPerm(perms?: unknown) {
  const p = Array.isArray(perms) ? (perms as string[]) : [];
  return p.includes("USER_CREATE") || p.includes("EMP_EDIT");
}

export async function POST(_: NextRequest, context: { params: Promise<{ jti: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("app_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = await verifyAppJWT(token);
    if (!hasAdminPerm((payload as any).permissions)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!supabaseAdmin) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const safeParams = (await context.params).jti ? await context.params : { jti: "" } as { jti: string };
    const jti = safeParams.jti;
    const { error } = await supabaseAdmin
      .from("app_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("jti", jti as any);
    if (error) throw error;
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
