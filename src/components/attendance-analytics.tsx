"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fetchLeaveBalance } from "@/lib/leave";

type Row = {
  attendance_date: string; // yyyy-mm-dd
  check_in_at: string | null;
  status: string | null;
  deleted_at: string | null;
};

function countWorkingDays(start: Date, end: Date) {
  // Inclusive count of Mon–Fri
  const d = new Date(start);
  let count = 0;
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

export function AttendanceAnalytics() {
  const [loading, setLoading] = React.useState(true);
  const [percent, setPercent] = React.useState<number>(0);
  const [presentDays, setPresentDays] = React.useState<number>(0);
  const [workingDays, setWorkingDays] = React.useState<number>(0);
  const [leaveUsed, setLeaveUsed] = React.useState<number>(0);
  const [leaveRemain, setLeaveRemain] = React.useState<number>(0);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        // Resolve employee id
        const me = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await me.json()) as any;
        const employeeId: number | null = data?.employee?.id ?? null;
        if (!employeeId || !supabaseBrowser) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Period: current month up to today
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const wd = countWorkingDays(monthStart, today);
        if (!cancelled) setWorkingDays(wd);

        const from = monthStart.toISOString().slice(0, 10);
        const to = today.toISOString().slice(0, 10);

        const { data: rows, error } = await supabaseBrowser
          .from("attendance")
          .select("attendance_date, check_in_at, status, deleted_at")
          .eq("employee_id", employeeId)
          .gte("attendance_date", from)
          .lte("attendance_date", to);
        if (error) throw error;

        const list = (rows as Row[]) || [];
        const present = list.filter((r) => r.deleted_at == null && !!r.check_in_at).length;
        const pct = wd > 0 ? Math.round((present / wd) * 100) : 0;

        if (!cancelled) {
          setPresentDays(present);
          setPercent(Math.max(0, Math.min(100, pct)));
        }
      } catch {
        if (!cancelled) {
          setPresentDays(0);
          setPercent(0);
          setLeaveUsed(0);
          setLeaveRemain(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load leave balance separately (on mount)
  React.useEffect(() => {
    let cancelled = false;
    async function loadBalance() {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await me.json()) as any;
        const employeeId: number | null = data?.employee?.id ?? null;
        if (!employeeId) return;
        const bal = await fetchLeaveBalance(employeeId);
        if (!cancelled && bal) {
          setLeaveUsed(bal.used);
          setLeaveRemain(bal.remaining);
        }
      } catch {
        if (!cancelled) {
          setLeaveUsed(0);
          setLeaveRemain(0);
        }
      }
    }
    loadBalance();
    return () => {
      cancelled = true;
    };
  }, []);

  // Ring dasharray expects "value, 100"
  const dash = `${percent}, 100`;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Attendance progress */}
      <div className="group rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="relative h-16 w-16">
            <svg viewBox="0 0 36 36" className="h-16 w-16">
              <path
                className="stroke-gray-200"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="stroke-[#23A1A0]"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={dash}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-sm font-semibold text-gray-900">{loading ? "—" : `${percent}%`}</span>
            </div>
          </div>
          <p className="text-xs text-gray-500">Attendance</p>
          <p className="text-[11px] text-gray-500">{presentDays}/{workingDays} days</p>
        </div>
      </div>

      {/* Annual Leave */}
      <div className="group rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#23A1A0]/10 text-[#23A1A0]">
          <span className="text-xl font-semibold">{loading ? "—" : String(leaveUsed).padStart(2, "0")}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">Cuti Tahun Ini</p>
        <p className="text-[11px] text-gray-500">Sisa: {leaveRemain}</p>
      </div>

      {/* Working Days (Ongoing) */}
      <div className="group rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#093A58]/10 text-[#093A58]">
          <span className="text-xl font-semibold">{loading ? "—" : workingDays}</span>
        </div>
        <p className="mt-2 text-xs text-gray-500">Working Days</p>
      </div>
    </div>
  );
}
