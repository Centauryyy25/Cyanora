"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";

export type LeaveBalance = {
  year: number;
  entitlement: number; // total_quota
  used: number; // used_quota
  remaining: number; // remaining_quota
};

function daysInclusive(start: string, end: string): number {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const diff = Math.floor((e.getTime() - s.getTime()) / 86400000);
  return diff >= 0 ? diff + 1 : 0;
}

export async function fetchLeaveBalance(employeeId: number, opts?: { entitlement?: number }): Promise<LeaveBalance | null> {
  if (!supabaseBrowser) return null;
  const now = new Date();
  const year = now.getFullYear();
  const entitlement = opts?.entitlement ?? 12;
  try {
    // Prefer precomputed table (per schema provided)
    const { data: lbData, error: lbErr } = await supabaseBrowser
      .from("leave_balances")
      .select("year, total_quota, used_quota, remaining_quota")
      .eq("employee_id", employeeId)
      .eq("year", year)
      .maybeSingle();
    if (!lbErr && lbData) {
      const used = (lbData as any).used_quota ?? 0;
      const ent = (lbData as any).total_quota ?? (opts?.entitlement ?? 12);
      const remaining = (lbData as any).remaining_quota ?? Math.max(0, ent - used);
      return { year, entitlement: ent, used, remaining };
    }
  } catch {}

  // Fallback: compute from approved leave_requests
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  try {
    const { data, error } = await supabaseBrowser
      .from("leave_requests")
      .select("start_date, end_date, leave_type, status")
      .eq("employee_id", employeeId)
      .eq("status", "APPROVED")
      .eq("leave_type", "CUTI_TAHUNAN")
      .gte("start_date", from)
      .lte("end_date", to);
    if (error) throw error;
    const list = (data as any[]) || [];
    const used = list.reduce((sum, r) => sum + daysInclusive(r.start_date, r.end_date), 0);
    const remaining = Math.max(0, entitlement - used);
    return { year, entitlement, used, remaining };
  } catch {
    return { year, entitlement, used: 0, remaining: entitlement };
  }
}
