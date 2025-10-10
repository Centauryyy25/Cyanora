"use client";

import * as React from "react";
import { getSupabaseSafe } from "@/lib/supabase-client-safe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ymdLocal } from "@/lib/date";

type AttendanceRow = {
  attendance_date: string;
  check_in_at: string | null;
  status: string | null;
  deleted_at: string | null;
};

type LeaveRow = {
  start_date: string;
  end_date: string;
  leave_type: string; // 'CUTI_TAHUNAN','IZIN','SAKIT'
  status: string; // 'PENDING','APPROVED',...
};

function startOfWeekMonday(d: Date) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // days since Monday
  const res = new Date(d);
  res.setHours(0, 0, 0, 0);
  res.setDate(d.getDate() - diff);
  return res;
}

export function WeeklyStatus() {
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [days, setDays] = React.useState<{ d: string; s: string; c: string }[]>([
    { d: "Mon", s: "—", c: "text-gray-400" },
    { d: "Tue", s: "—", c: "text-gray-400" },
    { d: "Wed", s: "—", c: "text-gray-400" },
    { d: "Thu", s: "—", c: "text-gray-400" },
    { d: "Fri", s: "—", c: "text-gray-400" },
  ]);

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
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!employeeId) return;
    let supabase: SupabaseClient;
    try {
      supabase = getSupabaseSafe();
    } catch {
      return;
    }
    let cancelled = false;
    async function load() {
      const now = new Date();
      const start = startOfWeekMonday(now);
      const end = new Date(start);
      end.setDate(start.getDate() + 4); // Friday

      const from = ymdLocal(start);
      const to = ymdLocal(end);
      const todayKey = ymdLocal(now);

      try {
        const [{ data: attRows, error: attErr }, { data: lvRows, error: lvErr }] = await Promise.all([
          supabase
            .from("attendance")
            .select("attendance_date, check_in_at, status, deleted_at")
            .eq("employee_id", employeeId)
            .gte("attendance_date", from)
            .lte("attendance_date", to),
          supabase
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

        const computed: { d: string; s: string; c: string }[] = [];
        for (let i = 0; i < 5; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          const key = ymdLocal(date);
          const label = ["Mon", "Tue", "Wed", "Thu", "Fri"][i];

          // default for future days
          if (key > todayKey) {
            computed.push({ d: label, s: "—", c: "text-gray-400" });
            continue;
          }

          const a = att.find((x) => x.attendance_date === key && x.deleted_at == null);
          const l = leaves.find((lr) => lr.start_date <= key && lr.end_date >= key);

          if (a) {
            if (a.status && a.status !== "HADIR") {
              computed.push({ d: label, s: "A", c: "text-amber-600" });
            } else if (a.check_in_at) {
              computed.push({ d: label, s: "✔️", c: "text-emerald-600" });
            } else {
              computed.push({ d: label, s: "✔️", c: "text-emerald-600" });
            }
          } else if (l) {
            computed.push({ d: label, s: "A", c: "text-amber-600" });
          } else {
            computed.push({ d: label, s: "❌", c: "text-rose-600" });
          }
        }

        if (!cancelled) setDays(computed);
      } catch {
        // keep defaults on error
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {days.map((x) => (
          <div key={x.d} className="flex flex-col items-center">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-sm font-semibold ring-1 ring-gray-200">
              <span className={x.c}>{x.s}</span>
            </div>
            <span className="mt-1 text-xs text-gray-500">{x.d}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      <p className="mt-3 text-xs text-gray-500">✔️ Present • ❌ Absent • A Leave</p>
    </div>
  );
}
