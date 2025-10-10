"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { ChevronDown, CheckCircle2, XCircle, Ban } from "lucide-react";

type LeaveRow = {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
};

export function ApprovalCenter() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<LeaveRow[]>([]);
  const [open, setOpen] = React.useState<Set<number>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"PENDING" | "APPROVED" | "REJECTED" | "CANCELLED">("PENDING");

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!supabaseBrowser) {
        setError("Server not configured (Supabase)");
        setRows([]);
        return;
      }
      const { data, error } = await supabaseBrowser
        .from("leave_requests")
        .select("id, employee_id, start_date, end_date, leave_type, reason, status")
        .eq("status", filter)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data ?? []) as LeaveRow[]);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat pengajuan");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      await load();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function act(id: number, action: "APPROVED" | "REJECTED" | "CANCELLED") {
    try {
      if (!supabaseBrowser) return;
      const now = new Date().toISOString();
      const { error } = await supabaseBrowser
        .from("leave_requests")
        .update({ status: action, approved_at: action === "APPROVED" ? now : null })
        .eq("id", id);
      if (error) throw error;
      // Optional: write approval_logs
      try {
        await supabaseBrowser.from("approval_logs").upsert({
          leave_id: id,
          step: "HR",
          action: action === "APPROVED" ? "APPROVED" : action === "REJECTED" ? "REJECTED" : "PENDING",
          approved_at: action === "APPROVED" ? now : null,
        } as any);
      } catch {}
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
    } catch (e: any) {
      console.error("ApprovalCenter action error:", e?.message || e);
      alert(e?.message || "Gagal mengubah status. Pastikan RLS mengizinkan HR.");
    }
  }

  return (
    <section className="mx-auto max-w-screen-md px-5 pt-6">
      {/* Filter tabs */}
      <div className="mb-3 flex gap-2 text-xs">
        {(["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const).map((s) => (
          <button
            key={s}
            className={`h-8 rounded-full border px-3 font-medium transition ${
              filter === s ? "bg-[#23A1A0] text-white border-[#23A1A0]" : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

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
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">Tidak ada data.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((r) => {
            const isOpen = open.has(r.id);
            const toggle = () => setOpen((prev) => { const n = new Set(prev); n.has(r.id) ? n.delete(r.id) : n.add(r.id); return n; });
            const statusBadge = (
              <span
                className={
                  "inline-flex rounded-full px-2 py-0.5 text-xs font-medium border " +
                  (r.status === "PENDING"
                    ? "border-amber-500/20 bg-amber-500/15 text-amber-700"
                    : r.status === "APPROVED"
                    ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-700"
                    : r.status === "REJECTED"
                    ? "border-rose-500/20 bg-rose-500/15 text-rose-700"
                    : "border-gray-300 bg-gray-100 text-gray-700")
                }
              >
                {r.status}
              </span>
            );
            return (
              <div key={r.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {r.leave_type === "CUTI_TAHUNAN" ? "Cuti" : r.leave_type} • {r.start_date} – {r.end_date}
                    </p>
                    <p className="text-[11px] text-gray-500">Employee ID: {r.employee_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge}
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.status !== "APPROVED" && (
                        <button
                          onClick={() => act(r.id, "APPROVED")}
                          className="inline-flex items-center gap-1 h-8 rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:brightness-110"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                      )}
                      {r.status !== "REJECTED" && (
                        <button
                          onClick={() => act(r.id, "REJECTED")}
                          className="inline-flex items-center gap-1 h-8 rounded-lg bg-rose-600 px-3 text-xs font-medium text-white hover:brightness-110"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                      )}
                      {r.status !== "CANCELLED" && (
                        <button
                          onClick={() => act(r.id, "CANCELLED")}
                          className="inline-flex items-center gap-1 h-8 rounded-lg bg-gray-600 px-3 text-xs font-medium text-white hover:brightness-110"
                        >
                          <Ban className="h-3.5 w-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

