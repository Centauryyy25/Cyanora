"use client";

import * as React from "react";
import NavigationBar from "@/components/ui/navigation-bar";
import { RoleGuard } from "@/components/role-guard";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ChevronDown } from "lucide-react";

type Row = {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
};

export default function HRApprovalsPage() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [open, setOpen] = React.useState<Set<number>>(new Set());
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        if (!supabaseBrowser) return;
        const { data, error } = await supabaseBrowser
          .from("leave_requests")
          .select("id, employee_id, start_date, end_date, leave_type, reason, status")
          .eq("status", "PENDING")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows((data ?? []) as Row[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal memuat data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function act(id: number, action: "APPROVED" | "REJECTED") {
    try {
      if (!supabaseBrowser) return;
      const { error } = await supabaseBrowser
        .from("leave_requests")
        .update({ status: action })
        .eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    } catch (e: any) {
      alert(e?.message || "Gagal mengubah status. Pastikan RLS mengizinkan HR.");
    }
  }

  return (
    <RoleGuard allow={["HR"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="mt-1 text-sm text-white/80">Persetujuan Cuti/Izin/Sakit (Pending)</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 pt-6">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">{error}</div>
          )}
          {!loading && !error && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Tidak ada pengajuan pending.</div>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="space-y-2">
              {rows.map((r) => {
                const isOpen = open.has(r.id);
                const toggle = () => setOpen((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; });
                return (
                  <div key={r.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{r.leave_type === "CUTI_TAHUNAN" ? "Cuti" : r.leave_type} • {r.start_date} – {r.end_date}</p>
                        <p className="text-[11px] text-gray-500">Employee ID: {r.employee_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full border border-amber-500/20 bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700">{r.status}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-gray-700">
                        {r.reason && (
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Alasan</p>
                            <p className="font-medium text-gray-900">{r.reason}</p>
                          </div>
                        )}
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => act(r.id, "APPROVED")} className="h-8 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:brightness-110">Approve</button>
                          <button onClick={() => act(r.id, "REJECTED")} className="h-8 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:brightness-110">Reject</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </RoleGuard>
  );
}

