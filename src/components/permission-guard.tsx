"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = {
  requireAny?: string[]; // allow if has any of these permission codes
  requireAll?: string[]; // allow only if has all
  redirectTo?: string; // where to go after deny (default: /home)
  children: React.ReactNode;
};

function inferAudience(codes: string[]): string[] {
  const set = new Set<string>();
  for (const c of codes) {
    if (["EMP_VIEW", "EMP_EDIT", "USER_CREATE"].includes(c)) set.add("Admin");
    if (["LEAVE_APPROVE"].includes(c)) set.add("HR");
    if (["LEAVE_REQUEST", "ATTENDANCE_LOG"].includes(c)) set.add("Karyawan");
  }
  return Array.from(set);
}

export function PermissionGuard({ requireAny, requireAll, redirectTo = "/home", children }: Props) {
  const [state, setState] = React.useState<"loading" | "allow" | "deny">("loading");
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await res.json()) as any;
        const perms: string[] = Array.isArray(data?.permissions) ? data.permissions : [];
        const roleName: string | null = data?.role?.name ?? null;

        // Temporary override: allow full access for HR & Karyawan EXCEPT pages needing LEAVE_APPROVE (HR-only)
        const required = (requireAll && requireAll.length ? requireAll : requireAny) || [];
        const needsHrOnly = required.includes("LEAVE_APPROVE");
        const isAdmin = roleName === "Admin";
        const roleOverride = isAdmin || (needsHrOnly ? roleName === "HR" : Boolean(roleName && ["HR", "Karyawan", "Admin"].includes(roleName)));

        const hasAny = !requireAny || requireAny.some((p) => perms.includes(p));
        const hasAll = !requireAll || requireAll.every((p) => perms.includes(p));
        const ok = roleOverride || (hasAny && hasAll);
        if (!cancelled) setState(ok ? "allow" : "deny");
      } catch {
        if (!cancelled) setState("deny");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [requireAny?.join("|"), requireAll?.join("|")]);

  React.useEffect(() => {
    if (state === "deny") {
      const codes = (requireAll && requireAll.length ? requireAll : requireAny) || [];
      const roles = inferAudience(codes);
      console.warn("PermissionGuard deny", { requiredAny: requireAny, requiredAll: requireAll, inferredRoles: roles });
      console.log("Butuh izin:", codes);
      const dest = redirectTo === "/login" ? "/home" : redirectTo;
      router.replace(dest);
    }
  }, [state, router, redirectTo, requireAny, requireAll]);

  if (state !== "allow") {
    return (
      <div className="grid min-h-[40dvh] place-items-center">
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
          <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
          <div className="mb-2 h-4 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
