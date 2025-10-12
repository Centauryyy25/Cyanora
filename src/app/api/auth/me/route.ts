import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

// ✅ normalized for Next.js 15
export async function GET(_: NextRequest) {
  try {
    const session = await auth();
    const cookieStore = await cookies();

    let user: any = null;
    let employee: any = null;
    let role: any = null;
    let permissions: string[] = [];

    // 1) Prefer custom app_session (DB authoritative)
    const appToken = cookieStore.get("app_session")?.value;
    if (appToken) {
      try {
        const payload = await verifyAppJWT(appToken);
        user = {
          id: payload.sub,
          name: payload.username ?? null,
          email: payload.email ?? null,
          image: null,
        };
        // Role from token first, then DB by email
        if ((payload as any).role) {
          role = { id: null, name: (payload as any).role };
        }
        if (Array.isArray((payload as any).permissions)) {
          permissions = (payload as any).permissions as string[];
        }
        if ((!role || !role.name) && user.email && supabaseAdmin) {
          const { data: urow } = await supabaseAdmin
            .from("users")
            .select("id, role_id, roles(name)")
            .eq("email", user.email)
            .maybeSingle();
          if (urow) {
            role = {
              id: (urow as any).role_id ?? null,
              name: Array.isArray((urow as any).roles)
                ? (urow as any).roles?.[0]?.name ?? null
                : (urow as any).roles?.name ?? null,
            };
            try {
              const { data: perms } = await supabaseAdmin
                .from("role_permissions")
                .select("allowed, permissions:permissions(code)")
                .eq("role_id", (urow as any).role_id);
              permissions = (perms || [])
                .filter((r: any) => r.allowed)
                .map((r: any) => r.permissions?.code)
                .filter(Boolean) as string[];
            } catch {}
          }
        }
        // Employee from token first. If admin client available, enrich; else use payload as-is
        if ((payload as any).employee?.id) {
          employee = (payload as any).employee as any;
          if (supabaseAdmin) {
            const { data: emp } = await supabaseAdmin
              .from("employees")
              .select(
                `id, full_name, employment_status, email, departments(name), positions(title)`
              )
              .eq("id", (payload as any).employee.id)
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
              } as any;
            }
          }
        } else if (user.email && supabaseAdmin) {
          const { data: emp } = await supabaseAdmin
            .from("employees")
            .select(
              `id, full_name, employment_status, email, departments(name), positions(title)`
            )
            .eq("email", user.email)
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
      } catch {
        // ignore invalid token and fallback to NextAuth
      }
    }

    // 2) Fallback to NextAuth session if app_session not present/invalid
    if (!user && session?.user) {
      user = {
        id: (session.user as any).id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      };
      const email = user?.email as string | undefined;
      if (email && supabaseAdmin) {
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
            try {
              const { data: perms } = await supabaseAdmin
                .from("role_permissions")
                .select("allowed, permissions:permissions(code)")
                .eq("role_id", (urow as any).role_id);
              permissions = (perms || [])
                .filter((r: any) => r.allowed)
                .map((r: any) => r.permissions?.code)
                .filter(Boolean) as string[];
            } catch {}
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
    }

    return NextResponse.json({ data: { user, employee, role, permissions } }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
