import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

const updateSchema = z.object({
  nik: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  position_id: z.coerce.number().int().positive().optional(),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  employment_status: z.enum(["ACTIVE", "PROBATION", "INACTIVE"]).optional(),
  phone_number: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  photo_url: z.string().url().nullable().optional(),
});

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("app_session")?.value;
  if (!token) return { ok: false as const, status: 401 };
  try {
    const payload = await verifyAppJWT(token);
    const role = (payload as any)?.role ?? null;
    if (role !== "Admin") return { ok: false as const, status: 403 };
  } catch {
    return { ok: false as const, status: 401 };
  }
  if (!supabaseAdmin) return { ok: false as const, status: 500 };
  return { ok: true as const };
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: check.status });
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    const patch = parsed.data;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Empty update" }, { status: 400 });
    const { error } = await supabaseAdmin!
      .from("employees")
      .update(patch)
      .eq("id", id);
    if (error) {
      console.error("/api/admin/employees/[id] PUT error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: check.status });
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const { error } = await supabaseAdmin!
      .from("employees")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("/api/admin/employees/[id] DELETE error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ error: "Forbidden" }, { status: check.status });
  try {
    const { id: idParam } = await context.params;
    const id = Number(idParam);
    if (!Number.isFinite(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    const { data, error } = await supabaseAdmin!
      .from("employees")
      .select("id, nik, full_name, email, phone_number, address, photo_url, join_date, employment_status, department_id, position_id")
      .eq("id", id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
