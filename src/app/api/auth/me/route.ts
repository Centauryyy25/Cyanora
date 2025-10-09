import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAppJWT, signAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    // Ensure we have a CSRF cookie ready (used by login form)
    if (!cookieStore.get("csrf_token")) {
      const resp = NextResponse.json({ csrf: "issued" }, { status: 200 });
      resp.cookies.set("csrf_token", crypto.randomUUID(), {
        httpOnly: false,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60,
      });
      return resp;
    }

    const token = cookieStore.get("app_session")?.value;
    if (!token) {
      return NextResponse.json({ data: null }, { status: 200 });
    }
    const payload = await verifyAppJWT(token);

    // If employee.id missing, enrich session from Supabase and refresh cookie
    const hasEmp = (payload as any)?.employee && (payload as any).employee?.id;
    const userId = payload?.sub ? Number(payload.sub) : null;

    if (!hasEmp && userId && supabaseAdmin) {
      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select(
          `id, full_name, employment_status, department:departments(name), position:positions(title)`
        )
        .eq("user_id", userId)
        .maybeSingle();

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

      const refreshed = await signAppJWT({
        ...payload,
        employee: emp
          ? {
              id: (emp as any).id,
              full_name: (emp as any).full_name,
              department: departmentName,
              position: positionTitle,
              employment_status: (emp as any).employment_status ?? null,
            }
          : null,
      } as any);

      const resp = NextResponse.json({
        data: {
          ...(payload as any),
          employee: emp
            ? {
                id: (emp as any).id,
                full_name: (emp as any).full_name,
                department: departmentName,
                position: positionTitle,
                employment_status: (emp as any).employment_status ?? null,
              }
            : null,
        },
      }, { status: 200 });

      resp.cookies.set("app_session", refreshed, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 12,
      });

      // Optional audit log
      try {
        await supabaseAdmin.from("activity_logs").insert({
          user_id: userId,
          entity_type: "SESSION_REFRESH",
          action: "REFRESH",
          description: "Session JWT enriched with employee details",
        });
      } catch {}

      return resp;
    }

    return NextResponse.json({ data: payload }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
