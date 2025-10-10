import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ALLOWED = ["ACTIVE", "PROBATION", "INACTIVE"] as const;

export async function PATCH(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const safeParams = (await context.params).id ? await context.params : { id: "" } as { id: string };
    const id = Number(safeParams?.id);
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid employee id" }, { status: 400 });
    }

    // AuthN/AuthZ: require app_session with role HR
    const cookieStore = await cookies();
    const token = cookieStore.get("app_session")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    let role: string | null = null;
    try {
      const payload = await verifyAppJWT(token);
      role = (payload as any)?.role ?? null;
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }
    if (role !== "HR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body
    const body = await _req.json().catch(() => ({}));
    const schema = z.object({ status: z.enum(ALLOWED) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const next = parsed.data.status;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("employees")
      .update({ employment_status: next })
      .eq("id", id);

    if (error) {
      console.error("/api/employees/[id]/status: update error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: { id, status: next } }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
