"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { getSupabaseSafe } from "@/lib/supabase-client-safe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { UserCheck, ChevronDown } from "lucide-react";
import { ymdLocal } from "@/lib/date";

type Props = {
  label?: string;
  style?: React.CSSProperties;
  inline?: boolean;
  defaultOpen?: boolean;
  hideTrigger?: boolean;
};

type AttendanceRow = {
  attendance_date: string; // yyyy-mm-dd
  check_in_at: string | null;
  check_out_at: string | null;
  status: string | null; // 'HADIR','IZIN','SAKIT','CUTI','ALFA'
  deleted_at: string | null;
};

type LeaveRow = {
  start_date: string; // yyyy-mm-dd
  end_date: string;   // yyyy-mm-dd
  leave_type: string; // 'CUTI_TAHUNAN','IZIN','SAKIT'
  status: string;     // 'PENDING','APPROVED',...
};

function fmtDateLabel(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(d);
}

const ymd = ymdLocal;

function rangeDays(start: Date, end: Date) {
  const res: Date[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    res.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return res;
}

function badge(status: string) {
  const m: Record<string, string> = {
    HADIR: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20",
    SAKIT: "bg-rose-500/15 text-rose-700 border-rose-500/20",
    IZIN: "bg-blue-500/15 text-blue-700 border-blue-500/20",
    CUTI: "bg-cyan-500/15 text-cyan-700 border-cyan-500/20",
    ALFA: "bg-red-500/15 text-red-700 border-red-500/20",
    LIBUR: "bg-muted text-gray-600 border-transparent",
  };
  return m[status] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function AttendanceHistoryAction({ label = "Kehadiran", style, inline = false, defaultOpen = false, hideTrigger = false }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<{
    date: string;
    label: string;
    status: string;
    detail?: string;
    inTime?: string | null;
    outTime?: string | null;
  }[]>([]);
  const [openSet, setOpenSet] = React.useState<Set<string>>(new Set());
  // monthOffset = 0 for current month, -1 for previous, etc.
  const [monthOffset, setMonthOffset] = React.useState<number>(0);

  // Resolve employee id
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
    return () => {
      cancelled = true;
    };
  }, []);

  // Load when opened or inline view, and when month changes
  React.useEffect(() => {
    if (!(inline || open)) return;
    if (employeeId == null) return;
    let sb: SupabaseClient | null = null;
    try {
      sb = getSupabaseSafe();
    } catch {
      return;
    }
    const client = sb as SupabaseClient;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        // sb is guaranteed by getSupabaseSafe()
        const now = new Date();
        const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
        const start = new Date(base.getFullYear(), base.getMonth(), 1);
        const isCurrentMonth = base.getFullYear() === now.getFullYear() && base.getMonth() === now.getMonth();
        const endOfMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0);
        const end = isCurrentMonth ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : endOfMonth;
        const from = ymd(start);
        const to = ymd(end);

        // Safe check for supabaseBrowser
        const [{ data: attRows, error: attErr }, { data: lvRows, error: lvErr }] = await Promise.all([
          client
            .from("attendance")
            .select("attendance_date, check_in_at, check_out_at, status, deleted_at")
            .eq("employee_id", employeeId)
            .gte("attendance_date", from)
            .lte("attendance_date", to),
          client
            .from("leave_requests")
            .select("start_date, end_date, leave_type, status")
            .eq("employee_id", employeeId)
            .eq("status", "APPROVED")
            .lte("start_date", to)
            .gte("end_date", from),
        ]);
        if (attErr) throw attErr;
        if (lvErr) throw lvErr;

        const att = (attRows as AttendanceRow[]) ?? [];
        const leaves = (lvRows as LeaveRow[]) ?? [];

        const days = rangeDays(start, end);
        const list = days.map((d) => {
          const key = ymd(d);
          // attendance
          const a = att.find((x) => x.attendance_date === key && x.deleted_at == null);
          // leave covering this day
          const l = leaves.find((lr) => lr.start_date <= key && lr.end_date >= key);
          let status = "";
          let detail: string | undefined;
          let inTime: string | null = null;
          let outTime: string | null = null;
          if (a) {
            if (a.status && a.status !== "HADIR") status = a.status;
            else if (a.check_in_at) status = "HADIR";
            else status = "HADIR"; // default if record exists
            if (a.check_in_at) {
              const t = new Date(a.check_in_at);
              inTime = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              detail = `In ${inTime}`;
            }
            if (a.check_out_at) {
              const t = new Date(a.check_out_at);
              outTime = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            }
          } else if (l) {
            status = l.leave_type === "CUTI_TAHUNAN" ? "CUTI" : l.leave_type; // map
          } else if (d.getDay() === 0 || d.getDay() === 6) {
            status = "LIBUR";
          } else {
            status = "ALFA";
          }
          return { date: key, label: fmtDateLabel(d), status, detail, inTime, outTime };
        });

        if (!cancelled) setItems(list.reverse()); // newest first
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, inline, employeeId, monthOffset]);

  const monthLabel = React.useMemo(() => {
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(base);
  }, [monthOffset]);

  const canNext = React.useMemo(() => monthOffset < 0, [monthOffset]);

  const headerControls = (
    <div className="px-4 pb-3">
          <div className="mb-2 flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg px-2 text-xs"
              onClick={() => setMonthOffset((v) => v - 1)}
            >
              Bulan Sebelumnya
            </Button>
            <p className="text-sm font-medium text-gray-900">{monthLabel}</p>
            <Button
              type="button"
              variant="outline"
              className="h-8 rounded-lg px-2 text-xs disabled:opacity-50"
              onClick={() => setMonthOffset((v) => Math.min(0, v + 1))}
              disabled={!canNext}
            >
              Bulan Berikutnya
            </Button>
          </div>
    </div>
  );

  const listContent = (
    <div className="max-h-[55dvh] overflow-y-auto px-4 pb-4">
          {!employeeId && (
            <p className="mt-2 text-xs text-amber-600">Akun belum terkait karyawan. Silakan login ulang.</p>
          )}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          )}
          {!loading && items.length === 0 && (
            <p className="text-sm text-gray-500">Data tidak tersedia.</p>
          )}
          {!loading && items.length > 0 && (
            <div className="space-y-2">
              {items.map((it) => {
                const isOpen = openSet.has(it.date);
                const toggle = () => {
                  setOpenSet((prev) => {
                    const next = new Set(prev);
                    if (next.has(it.date)) next.delete(it.date);
                    else next.add(it.date);
                    return next;
                  });
                };
                return (
                  <div key={it.date} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={toggle}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">{it.label}</p>
                        {it.detail && <p className="text-xs text-gray-500">{it.detail}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge(it.status)}`}>
                          {it.status}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-gray-700">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Clock In</p>
                            <p className="font-medium text-gray-900">{it.inTime ?? "—"}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-[11px] text-gray-500">Clock Out</p>
                            <p className="font-medium text-gray-900">{it.outTime ?? "—"}</p>
                          </div>
                        </div>
                        {(!it.inTime && !it.outTime) && (
                          <p className="mt-2 text-[11px] text-gray-500">Tidak ada data absen untuk tanggal ini.</p>
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
          <p className="text-sm font-semibold text-gray-900">Riwayat Kehadiran</p>
          <p className="text-xs text-gray-500">Bulan berjalan hingga hari ini</p>
        </div>
        {headerControls}
        {listContent}
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
              <UserCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="bottom" className="rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">Riwayat Kehadiran</SheetTitle>
          <SheetDescription>Bulan berjalan hingga hari ini</SheetDescription>
        </SheetHeader>
        {headerControls}
        {listContent}
      </SheetContent>
    </Sheet>
  );
}
