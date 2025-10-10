"use client";

import * as React from "react";
import NavigationBar from "@/components/ui/navigation-bar";
import { PermissionGuard } from "@/components/permission-guard";

type Row = {
  jti: string;
  created_at: string;
  revoked_at: string | null;
  user: { id: number; username?: string | null; email?: string | null; role?: string | null };
};

export default function AdminSessionsPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/sessions", { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || "Gagal memuat sesi");
      const json = await res.json();
      setRows(json.data || []);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat sesi");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function revoke(jti: string) {
    const ok = confirm("Revoke session ini?");
    if (!ok) return;
    const res = await fetch(`/api/admin/sessions/${jti}`, { method: "POST" });
    if (res.ok) load();
  }

  const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "short", timeStyle: "short" });

  return (
    <PermissionGuard requireAny={["USER_CREATE","EMP_EDIT"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Active Sessions</h1>
          <p className="mt-1 text-sm text-white/80">Pantau & putus sesi aktif pengguna</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 pt-6">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">{error}</div>
          )}
          {!loading && !error && (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.jti} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {r.user.username || r.user.email || `User #${r.user.id}`}
                      {r.user.role ? <span className="ml-2 text-xs font-normal text-gray-500">• {r.user.role}</span> : null}
                    </p>
                    <p className="text-[11px] text-gray-500">{fmt.format(new Date(r.created_at))} {r.revoked_at ? "(revoked)" : "(active)"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!r.revoked_at ? (
                      <button onClick={() => revoke(r.jti)} className="h-8 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:brightness-110">Revoke</button>
                    ) : (
                      <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] text-gray-600">Revoked</span>
                    )}
                  </div>
                </div>
              ))}
              {rows.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Tidak ada sesi.</div>
              )}
            </div>
          )}
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </PermissionGuard>
  );
}

