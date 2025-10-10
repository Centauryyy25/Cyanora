import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const session = await auth();
    const cookieStore = await cookies();

    let user: any = null;
    let employee: any = null;
    let role: any = null;

    // 1) Prefer NextAuth session if present
    if (session?.user) {
      user = {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
      const email = user?.email as string | undefined;
      if (email && supabaseAdmin) {
        // Resolve role from users table
        try {
          const { data: urow } = await supabaseAdmin
            .from("users")
            .select("id, role_id, roles(name)")
            .eq("email", email)
            .maybeSingle();
          if (urow) {
            role = {
              id: (urow as any).role_id ?? null,
              name: Array.isArray((urow as any).roles)
                ? (urow as any).roles?.[0]?.name ?? null
                : (urow as any).roles?.name ?? null,
            };
          }
        } catch {}
        const { data: emp } = await supabaseAdmin
          .from("employees")
          .select(
            `id, full_name, employment_status, email, departments(name), positions(title)`
          )
          .eq("email", email)
          .maybeSingle();
        if (emp) {
          const departmentName = Array.isArray((emp as any).departments)
            ? (emp as any).departments?.[0]?.name ?? null
            : (emp as any).departments?.name ?? null;
          const positionTitle = Array.isArray((emp as any).positions)
            ? (emp as any).positions?.[0]?.title ?? null
            : (emp as any).positions?.title ?? null;
          employee = {
            id: (emp as any).id,
            full_name: (emp as any).full_name,
            employment_status: (emp as any).employment_status ?? null,
            department: departmentName,
            position: positionTitle,
            email: (emp as any).email ?? null,
          };
        }
      }
    } else {
      // 2) Fallback to custom app_session JWT
      const token = cookieStore.get("app_session")?.value;
      if (token) {
        try {
          const payload = await verifyAppJWT(token);
          user = {
            id: payload.sub,
            name: payload.username ?? null,
            email: payload.email ?? null,
            image: null,
          };
          // Try role by email
          if (payload.email && supabaseAdmin) {
            try {
              const { data: urow } = await supabaseAdmin
                .from("users")
                .select("id, role_id, roles(name)")
                .eq("email", payload.email)
                .maybeSingle();
              if (urow) {
                role = {
                  id: (urow as any).role_id ?? null,
                  name: Array.isArray((urow as any).roles)
                    ? (urow as any).roles?.[0]?.name ?? null
                    : (urow as any).roles?.name ?? null,
                };
              }
            } catch {}
          }
          // Prefer employee id from payload
          if (payload.employee?.id) {
            if (supabaseAdmin) {
              const { data: emp } = await supabaseAdmin
                .from("employees")
                .select(
                  `id, full_name, employment_status, email, departments(name), positions(title)`
                )
                .eq("id", payload.employee.id)
                .maybeSingle();
              if (emp) {
                const departmentName = Array.isArray((emp as any).departments)
                  ? (emp as any).departments?.[0]?.name ?? null
                  : (emp as any).departments?.name ?? null;
                const positionTitle = Array.isArray((emp as any).positions)
                  ? (emp as any).positions?.[0]?.title ?? null
                  : (emp as any).positions?.title ?? null;
                employee = {
                  id: (emp as any).id,
                  full_name: (emp as any).full_name,
                  employment_status: (emp as any).employment_status ?? null,
                  department: departmentName,
                  position: positionTitle,
                  email: (emp as any).email ?? null,
                };
              }
            }
          } else if (payload.sub && supabaseAdmin) {
            // Try by user_id if provided as numeric
            const uid = Number(payload.sub);
            if (!Number.isNaN(uid)) {
              const { data: emp } = await supabaseAdmin
                .from("employees")
                .select(
                  `id, full_name, employment_status, email, departments(name), positions(title)`
                )
                .eq("user_id", uid)
                .maybeSingle();
              if (emp) {
                const departmentName = Array.isArray((emp as any).departments)
                  ? (emp as any).departments?.[0]?.name ?? null
                  : (emp as any).departments?.name ?? null;
                const positionTitle = Array.isArray((emp as any).positions)
                  ? (emp as any).positions?.[0]?.title ?? null
                  : (emp as any).positions?.title ?? null;
                employee = {
                  id: (emp as any).id,
                  full_name: (emp as any).full_name,
                  employment_status: (emp as any).employment_status ?? null,
                  department: departmentName,
                  position: positionTitle,
                  email: (emp as any).email ?? null,
                };
              }
            } else if (payload.email && supabaseAdmin) {
              const { data: emp } = await supabaseAdmin
                .from("employees")
                .select(
                  `id, full_name, employment_status, email, departments(name), positions(title)`
                )
                .eq("email", payload.email)
                .maybeSingle();
              if (emp) {
                const departmentName = Array.isArray((emp as any).departments)
                  ? (emp as any).departments?.[0]?.name ?? null
                  : (emp as any).departments?.name ?? null;
                const positionTitle = Array.isArray((emp as any).positions)
                  ? (emp as any).positions?.[0]?.title ?? null
                  : (emp as any).positions?.title ?? null;
                employee = {
                  id: (emp as any).id,
                  full_name: (emp as any).full_name,
                  employment_status: (emp as any).employment_status ?? null,
                  department: departmentName,
                  position: positionTitle,
                  email: (emp as any).email ?? null,
                };
              }
            }
          }
        } catch {
          // invalid token, ignore
        }
      }
    }

    return NextResponse.json({ data: { user, employee, role } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
