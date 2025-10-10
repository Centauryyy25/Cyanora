"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plane } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { fetchLeaveBalance } from "@/lib/leave";
import { LoaderOverlay } from "@/components/ui/loader-overlay";

type Props = {
  label?: string;
  style?: React.CSSProperties;
  inline?: boolean;
  defaultOpen?: boolean;
  hideTrigger?: boolean;
};

type LeaveType = "CUTI_TAHUNAN" | "IZIN";

export function LeaveRequestAction({ label = "Cuti", style, inline = false, defaultOpen = false, hideTrigger = false }: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [startDate, setStartDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = React.useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = React.useState("");
  const [leaveType, setLeaveType] = React.useState<LeaveType>("CUTI_TAHUNAN");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [leaveRemain, setLeaveRemain] = React.useState<number | null>(null);

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

  // Load leave balance once employee is known
  React.useEffect(() => {
    let cancelled = false;
    async function loadBal() {
      if (!employeeId) return;
      try {
        const bal = await fetchLeaveBalance(employeeId);
        if (!cancelled) setLeaveRemain(bal?.remaining ?? null);
      } catch {
        if (!cancelled) setLeaveRemain(null);
      }
    }
    loadBal();
    return () => { cancelled = true; };
  }, [employeeId]);

  const requestedDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate + "T00:00:00");
    const e = new Date(endDate + "T00:00:00");
    const diff = Math.floor((e.getTime() - s.getTime()) / 86400000);
    return diff >= 0 ? diff + 1 : 0;
  }, [startDate, endDate]);

  async function submitLeave() {
    setMessage(null);
    if (!supabaseBrowser) {
      setMessage({ type: "error", text: "Supabase belum dikonfigurasi." });
      return;
    }
    if (!employeeId) {
      setMessage({ type: "error", text: "Profil karyawan tidak ditemukan. Silakan login ulang." });
      return;
    }
    if (!startDate || !endDate) {
      setMessage({ type: "error", text: "Tanggal mulai dan akhir wajib diisi." });
      return;
    }
    if (endDate < startDate) {
      setMessage({ type: "error", text: "Tanggal akhir tidak boleh sebelum tanggal mulai." });
      return;
    }
    setLoading(true);
    try {
      if (leaveType === "CUTI_TAHUNAN" && leaveRemain != null && requestedDays > leaveRemain) {
        setMessage({ type: "error", text: `Sisa cuti tidak mencukupi (${leaveRemain} hari).` });
        return;
      }
      const payload = {
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason: reason || null,
      } as const;
      const { data, error } = await supabaseBrowser
        .from("leave_requests")
        .insert(payload)
        .select()
        .maybeSingle();
      if (error) throw error;
      setMessage({ type: "success", text: "Pengajuan terkirim. Menunggu persetujuan." });
      setReason("");
      setTimeout(() => setOpen(false), 700);
      return data;
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Gagal mengirim pengajuan." });
    } finally {
      setLoading(false);
    }
  }

  const inner = (
    <>
      <div className="px-4">
          {leaveRemain != null && (
            <div className="mb-3 flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
              <span>Sisa Cuti Tahun Ini</span>
              <span className="font-semibold text-gray-900">{leaveRemain} hari</span>
            </div>
          )}
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Jenis Pengajuan</label>
              <select
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#23A1A0] focus:ring-2 focus:ring-[#23A1A0]/30"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              >
                <option value="CUTI_TAHUNAN">Cuti</option>
                <option value="IZIN">Izin</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Tanggal Mulai</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Tanggal Akhir</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {leaveType === "CUTI_TAHUNAN" && (
              <p className="text-[11px] text-gray-500">Durasi pengajuan: {requestedDays} hari</p>
            )}
            <div className="grid gap-1">
              <label className="text-sm font-medium text-gray-700">Alasan (opsional)</label>
              <Textarea placeholder="Alasan pengajuan" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>

        {message && (
          <div
            className={
              message.type === "success"
                ? "mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                : "mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
            }
          >
            {message.text}
          </div>
        )}

        {!employeeId && (
          <p className="mt-2 text-xs text-amber-600">Akun belum terkait karyawan. Silakan login ulang.</p>
        )}
      </div>
      <div className="px-4 pb-4">
        <div className="flex w-full gap-2">
          <Button
            onClick={submitLeave}
            disabled={loading || !employeeId}
            className="h-10 flex-1 rounded-xl bg-[#093A58] text-white hover:brightness-110"
          >
            {loading ? "Mengirim..." : "Kirim Pengajuan"}
          </Button>
        </div>
      </div>
    </>
  );

  if (inline) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">Ajukan Cuti / Izin</p>
          <p className="text-xs text-gray-500">Pilih jenis pengajuan, tanggal, dan alasan</p>
        </div>
        {inner}
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
              <Plane className="h-5 w-5" aria-hidden="true" />
            </div>
            <span className="text-xs font-medium text-gray-700">{label}</span>
          </button>
        </SheetTrigger>
      )}
      <SheetContent side="bottom" className="relative rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">Ajukan Cuti / Izin</SheetTitle>
          <SheetDescription>Pilih jenis pengajuan, tanggal, dan alasan</SheetDescription>
        </SheetHeader>
        <LoaderOverlay show={loading} />
        {inner}
      </SheetContent>
    </Sheet>
  );
}
