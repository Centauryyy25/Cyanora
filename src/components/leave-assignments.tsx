"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { getSupabaseSafe } from "@/lib/supabase-client-safe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ClipboardList, ChevronDown } from "lucide-react";

type Props = {
  label?: string;
  style?: React.CSSProperties;
  inline?: boolean;
  defaultOpen?: boolean;
  hideTrigger?: boolean;
};

type LeaveRow = {
  id: number;
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  leave_type: string; // 'CUTI_TAHUNAN','IZIN','SAKIT'
  reason: string | null;
  attachment_url: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  approved_at: string | null;
  created_at: string;
};

function statusBadgeClass(s: LeaveRow["status"]) {
  switch (s) {
    case "PENDING":
      return "bg-amber-500/15 text-amber-700 border-amber-500/20";
    case "APPROVED":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-500/20";
    case "REJECTED":
    case "CANCELLED":
      return "bg-rose-500/15 text-rose-700 border-rose-500/20";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function typeLabel(t: string) {
  if (t === "CUTI_TAHUNAN") return "Cuti";
  if (t === "IZIN") return "Izin";
  if (t === "SAKIT") return "Sakit";
  return t;
}

function fmtDate(s: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(s));
  } catch {
    return s;
  }
}

export function LeaveAssignmentsAction({ label = "Assignments", style, inline = false, defaultOpen = false, hideTrigger = false }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState<LeaveRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | LeaveRow["status"]>("PENDING");
  const [openSet, setOpenSet] = React.useState<Set<number>>(new Set());

  // resolve employee id
  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const { data } = (await res.json()) as any;
        const empId: number | null = data?.employee?.id ?? null;
        if (!cancelled) setEmployeeId(empId);
      } catch {
        if (!cancelled) setEmployeeId(null);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // fetch when opened or inline
  React.useEffect(() => {
    if (!(inline || open)) return;
    if (employeeId == null) return;
    let sb: SupabaseClient | null = null;
    try {
      sb = getSupabaseSafe();
    } catch (e) {
      return;
    }
    const client: SupabaseClient = sb as SupabaseClient;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Safe guard for sb (Supabase client) to prevent null access
        if (!sb) { if (!cancelled) { setRows([]); setLoading(false); } return; }
        const { data, error } = await client
          .from("leave_requests")
          .select("id,start_date,end_date,leave_type,reason,attachment_url,status,approved_at,created_at")
          .eq("employee_id", employeeId)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setRows((data ?? []) as LeaveRow[]);
      } catch (e: any) {
        if (!cancelled) {
          setRows([]);
          setError(e?.message || "Gagal memuat data pengajuan.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open, inline, employeeId]);

  const view = React.useMemo(() => {
    return statusFilter === "ALL" ? rows : rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const filterBar = (
    <div className="px-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
              {(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ALL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s as any)}
                  className={`h-8 rounded-md px-2 text-xs transition ${statusFilter === s ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
    </div>
  );

  const list = (
    <div className="max-h-[55dvh] overflow-y-auto px-4 pb-4">
          {!employeeId && (
            <p className="text-xs text-amber-600">Akun belum terkait karyawan. Silakan login ulang.</p>
          )}
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
          {!loading && !error && view.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Tidak ada pengajuan untuk filter ini.
            </div>
          )}
          {!loading && !error && view.length > 0 && (
            <div className="space-y-2">
              {view.map((r) => {
                const isOpen = openSet.has(r.id);
                const toggle = () => setOpenSet((prev) => { const next = new Set(prev); next.has(r.id) ? next.delete(r.id) : next.add(r.id); return next; });
                return (
                  <div key={r.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{typeLabel(r.leave_type)} • {fmtDate(r.start_date)} – {fmtDate(r.end_date)}</p>
                        <p className="text-[11px] text-gray-500">Diajukan: {fmtDate(r.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClass(r.status)}`}>{r.status}</span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-gray-700">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Jenis</p>
                            <p className="font-medium text-gray-900">{typeLabel(r.leave_type)}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Periode</p>
                            <p className="font-medium text-gray-900">{fmtDate(r.start_date)} – {fmtDate(r.end_date)}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Status</p>
                            <p className="font-medium text-gray-900">{r.status}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Disetujui</p>
                            <p className="font-medium text-gray-900">{r.approved_at ? fmtDate(r.approved_at) : "—"}</p>
                          </div>
                        </div>
                        {r.reason && (
                          <div className="mt-2 rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Alasan</p>
                            <p className="font-medium text-gray-900">{r.reason}</p>
                          </div>
                        )}
                        {r.attachment_url && (
                          <div className="mt-2">
                            <a href={r.attachment_url} target="_blank" rel="noreferrer" className="text-[#23A1A0] underline underline-offset-4">Lihat Lampiran</a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
    </div>
  );

  if (inline) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Pengajuan Izin/Cuti/Sakit</p>
          <p className="text-xs text-gray-500">Status dan detail pengajuan kamu</p>
        </div>
        {filterBar}
        {list}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <SheetTrigger asChild>
          <button
            type="button"
            className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
            style={style}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
              <ClipboardList className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="bottom" className="rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">Pengajuan Izin/Cuti/Sakit</SheetTitle>
          <SheetDescription>Status dan detail pengajuan kamu</SheetDescription>
        </SheetHeader>
        {filterBar}
        {list}
      </SheetContent>
    </Sheet>
  );
}
