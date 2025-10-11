import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

const schema = z.object({
  nik: z.string().min(1),
  full_name: z.string().min(1),
  email: z.string().email(),
  department_id: z.coerce.number().int().positive(),
  position_id: z.coerce.number().int().positive(),
  join_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  employment_status: z.enum(["ACTIVE", "PROBATION", "INACTIVE"]).default("ACTIVE"),
  phone_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
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
    if (role !== "Admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const payload = parsed.data;

    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert({
        nik: payload.nik,
        full_name: payload.full_name,
        email: payload.email,
        department_id: payload.department_id,
        position_id: payload.position_id,
        join_date: payload.join_date,
        employment_status: payload.employment_status,
        phone_number: payload.phone_number ?? null,
        address: payload.address ?? null,
        photo_url: payload.photo_url ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("/api/admin/employees POST error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
