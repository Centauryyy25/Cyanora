"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Props = {
  allow: string[]; // role names allowed, e.g., ['Karyawan'] or ['HR']
  children: React.ReactNode;
  redirectTo?: string;
};

export function RoleGuard({ allow, children, redirectTo = "/login" }: Props) {
  const [state, setState] = React.useState<"loading" | "allow" | "deny">("loading");
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await res.json()) as any;
        const name: string | null = data?.role?.name ?? null;
        const ok = !!name && allow.map((s) => s.toLowerCase()).includes(name.toLowerCase());
        if (!cancelled) setState(ok ? "allow" : "deny");
      } catch {
        if (!cancelled) setState("deny");
      }
    }
    check();
    return () => { cancelled = true; };
  }, [allow]);

  React.useEffect(() => {
    if (state === "deny") router.replace(redirectTo);
  }, [state, router, redirectTo]);

  if (state !== "allow") {
    return (
      <div className="grid min-h-[40dvh] place-items-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-2 h-4 w-40 animate-pulse rounded bg-gray-100" />
          <div className="mb-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-100" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

