import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { ymdLocal } from "@/lib/date";

async function resolveEmployeeId(): Promise<number | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("app_session")?.value;
    if (!token) return null;
    const payload = await verifyAppJWT(token);
    if ((payload as any)?.employee?.id) {
      const id = Number((payload as any).employee.id);
      console.log("[AttendanceAPI] resolved employeeId from token:", id);
      return id;
    }
    // fallback by email if present
    const email = (payload as any)?.email as string | undefined;
    if (email && supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("employees")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      const id = (data as any)?.id ?? null;
      console.log("[AttendanceAPI] resolved employeeId by email:", email, "=>", id);
      return id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      console.warn("[AttendanceAPI] GET: supabaseAdmin not configured");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }
    const employeeId = await resolveEmployeeId();
    console.log("[AttendanceAPI] GET employeeId:", employeeId);
    if (!employeeId) return NextResponse.json({ data: null }, { status: 200 });
    const today = ymdLocal(new Date());
    console.log("[AttendanceAPI] GET today:", today);
    const { data, error } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("attendance_date", today)
      .maybeSingle();
    if (error) {
      console.error("[AttendanceAPI] GET error:", error?.message, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log("[AttendanceAPI] GET data:", data);
    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    console.error("[AttendanceAPI] GET exception:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      console.warn("[AttendanceAPI] POST: supabaseAdmin not configured");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }
    const employeeId = await resolveEmployeeId();
    if (!employeeId) return NextResponse.json({ error: "No employee" }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const mode = String(body?.mode || "");
    const lat = typeof body?.lat === "number" ? body.lat : null;
    const lng = typeof body?.lng === "number" ? body.lng : null;
    const note = (body?.note as string | null) || null;

    const today = ymdLocal(new Date());
    const nowIso = new Date().toISOString();
    console.log("[AttendanceAPI] POST", { employeeId, mode, lat, lng, today, note });

    const { data: existing, error: e1 } = await supabaseAdmin
      .from("attendance")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("attendance_date", today)
      .maybeSingle();
    if (e1) {
      console.error("[AttendanceAPI] select existing error:", e1?.message);
      return NextResponse.json({ error: e1.message }, { status: 500 });
    }

    if (mode === "checkin") {
      if (existing) {
        if (existing.check_in_at) {
          console.log("[AttendanceAPI] Already checked in, returning existing");
          return NextResponse.json({ data: existing }, { status: 200 });
        }
        const { data, error } = await supabaseAdmin
          .from("attendance")
          .update({
            check_in_at: nowIso,
            latitude: lat,
            longitude: lng,
            location_note: note,
            status: "HADIR",
          })
          .eq("employee_id", employeeId)
          .eq("attendance_date", today)
          .select()
          .maybeSingle();
        if (error) {
          console.error("[AttendanceAPI] update checkin error:", error?.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        console.log("[AttendanceAPI] update checkin data:", data);
        return NextResponse.json({ data }, { status: 200 });
      } else {
        const { data, error } = await supabaseAdmin
          .from("attendance")
          .insert({
            employee_id: employeeId,
            attendance_date: today,
            check_in_at: nowIso,
            latitude: lat,
            longitude: lng,
            location_note: note,
            status: "HADIR",
          })
          .select()
          .maybeSingle();
        if (error) {
          console.error("[AttendanceAPI] insert checkin error:", error?.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        console.log("[AttendanceAPI] insert checkin data:", data);
        return NextResponse.json({ data }, { status: 200 });
      }
    }

    if (mode === "checkout") {
      if (!existing?.check_in_at) {
        console.warn("[AttendanceAPI] checkout without checkin");
        return NextResponse.json({ error: "Check in first" }, { status: 400 });
      }
      const { data, error } = await supabaseAdmin
        .from("attendance")
        .update({ check_out_at: nowIso })
        .eq("employee_id", employeeId)
        .eq("attendance_date", today)
        .select()
        .maybeSingle();
      if (error) {
        console.error("[AttendanceAPI] update checkout error:", error?.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      console.log("[AttendanceAPI] update checkout data:", data);
      return NextResponse.json({ data }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (e: any) {
    console.error("[AttendanceAPI] POST exception:", e?.message || e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
