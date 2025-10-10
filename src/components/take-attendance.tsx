"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { LoaderOverlay } from "@/components/ui/loader-overlay";
import { getSupabaseSafe } from "@/lib/supabase-client-safe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ymdLocal } from "@/lib/date";
// Link import removed
import { AttendanceCard } from "@/components/attendance-card";

type AttendanceRow = {
  id: number;
  employee_id: number;
  attendance_date: string; // YYYY-MM-DD
  check_in_at: string | null;
  check_out_at: string | null;
  latitude: number | null;
  longitude: number | null;
  location_note: string | null;
  status: string;
};

export function TakeAttendanceSection() {
  const [open, setOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [today] = React.useState<string>(() => ymdLocal(new Date()));
  const [attendance, setAttendance] = React.useState<AttendanceRow | null>(null);
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [note, setNote] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Derive status text
  const statusText = React.useMemo(() => {
    if (!attendance) return "Not Checked In";
    if (attendance.check_out_at) {
      const t = new Date(attendance.check_out_at);
      return `Checked Out at ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (attendance.check_in_at) {
      const t = new Date(attendance.check_in_at);
      return `Checked In at ${t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
    return "Not Checked In";
  }, [attendance]);

  const isCheckedIn = Boolean(attendance?.check_in_at);
  const isCheckedOut = Boolean(attendance?.check_out_at);

  // Load employee id from session (via API) and fetch today's attendance
  React.useEffect(() => {
    // allow opening sheet from outside via custom event
    function onOpen() {
      console.log("[Attendance] received open-attendance event");
      setOpen(true);
    }
    try { window.addEventListener("open-attendance", onOpen as any); } catch {}
    return () => {
      try { window.removeEventListener("open-attendance", onOpen as any); } catch {}
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        // Try to resolve employee id from our app session
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await res.json()) as any;
        const empId: number | null = data?.employee?.id ?? null;
        console.log("[Attendance] resolved employeeId:", empId);
        if (!cancelled) setEmployeeId(empId);
      } catch {
        // ignore and leave employeeId null
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    async function clientLoadToday() {
      try {
        const supabase = getSupabaseSafe() as SupabaseClient;
        const { data, error } = await supabase
          .from("attendance")
          .select("*")
          .eq("employee_id", employeeId)
          .eq("attendance_date", today)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          console.warn("[Attendance] clientLoadToday error", error?.message);
          setAttendance(null);
        } else {
          console.log("[Attendance] clientLoadToday data", data);
          setAttendance(data as AttendanceRow);
        }
      } catch (e: any) {
        console.warn("[Attendance] clientLoadToday failed", e?.message || e);
        if (!cancelled) setAttendance(null);
      }
    }
    async function loadToday() {
      try {
        const res = await fetch("/api/attendance/today", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        console.log("[Attendance] GET today response:", json);
        if (res.ok) {
          setAttendance(json?.data ?? null);
        } else if (res.status === 500 && /Server not configured/i.test(String(json?.error))) {
          console.log("[Attendance] API not configured, fallback to client supabase");
          await clientLoadToday();
        } else {
          setAttendance(null);
        }
      } catch {
        if (!cancelled) setAttendance(null);
      }
    }
    loadToday();
    return () => {
      cancelled = true;
    };
  }, [employeeId, today]);

  // Auto-open sheet once per day if not checked in yet (Home UX boost)
  React.useEffect(() => {
    try {
      if (!employeeId) return;
      const key = `attendance:autoopen:${today}`;
      const already = typeof window !== "undefined" ? localStorage.getItem(key) : "1";
      const notCheckedIn = !attendance?.check_in_at; // includes null attendance
      if (notCheckedIn && !already) {
        console.log("[Attendance] auto-open sheet (not checked in)");
        setOpen(true);
        localStorage.setItem(key, "1");
      }
    } catch {}
  }, [attendance, employeeId, today]);

  // Geolocation capture (live)
  React.useEffect(() => {
    if (!navigator?.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
        console.log("[Attendance] watchPosition:", {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        });
      },
      () => {
        // ignore errors for now; user can retry
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
    return () => {
      try { navigator.geolocation.clearWatch(id); } catch {}
    };
  }, []);

  const refreshLocation = React.useCallback(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
        console.log("[Attendance] refreshLocation:", {
          lat: Number(latitude.toFixed(6)),
          lng: Number(longitude.toFixed(6)),
        });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  async function getOrSetAttendance(params: { mode: "checkin" | "checkout" }) {
    if (!employeeId) {
      setMessage({ type: "error", text: "Employee not recognized. Please re-login." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      console.log("[Attendance] POST submit", { mode: params.mode, lat, lng, note, employeeId, today });
      const res = await fetch("/api/attendance/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: params.mode, lat, lng, note }),
      });
      const json = await res.json();
      console.log("[Attendance] POST response", res.status, json);
      if (res.ok) {
        setAttendance(json?.data as AttendanceRow);
        setMessage({ type: "success", text: params.mode === "checkin" ? "Checked in successfully." : "Checked out successfully." });
      } else if (res.status === 500 && /Server not configured/i.test(String(json?.error))) {
        console.log("[Attendance] API not configured, fallback to client supabase submit");
        // Fallback to client supabase
        const supabase = getSupabaseSafe() as SupabaseClient;
        const nowIso = new Date().toISOString();
        if (params.mode === "checkin") {
          const { data: existing, error: selErr } = await supabase
            .from("attendance")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("attendance_date", today)
            .maybeSingle();
          if (selErr) throw selErr;
          if (existing) {
            if (existing.check_in_at) {
              setAttendance(existing as AttendanceRow);
              setMessage({ type: "success", text: "Already checked in." });
            } else {
              const { data, error } = await supabase
                .from("attendance")
                .update({
                  check_in_at: nowIso,
                  latitude: lat ?? null,
                  longitude: lng ?? null,
                  location_note: note || null,
                  status: "HADIR",
                })
                .eq("employee_id", employeeId)
                .eq("attendance_date", today)
                .select()
                .maybeSingle();
              if (error) throw error;
              setAttendance(data as AttendanceRow);
              setMessage({ type: "success", text: "Checked in successfully." });
            }
          } else {
            const insertPayload = {
              employee_id: employeeId,
              attendance_date: today,
              check_in_at: nowIso,
              latitude: lat ?? null,
              longitude: lng ?? null,
              location_note: note || null,
              status: "HADIR",
            };
            const { data, error } = await supabase
              .from("attendance")
              .insert(insertPayload)
              .select()
              .maybeSingle();
            if (error) throw error;
            setAttendance(data as AttendanceRow);
            setMessage({ type: "success", text: "Checked in successfully." });
          }
        } else {
          const { data: existing, error: e1 } = await supabase
            .from("attendance")
            .select("*")
            .eq("employee_id", employeeId)
            .eq("attendance_date", today)
            .maybeSingle();
          if (e1) throw e1;
          if (!existing?.check_in_at) {
            setMessage({ type: "error", text: "You must check in before check out." });
            return;
          }
          const { data, error } = await supabase
            .from("attendance")
            .update({ check_out_at: nowIso })
            .eq("employee_id", employeeId)
            .eq("attendance_date", today)
            .select()
            .maybeSingle();
          if (error) throw error;
          setAttendance(data as AttendanceRow);
          setMessage({ type: "success", text: "Checked out successfully." });
        }
      } else {
        throw new Error(json?.error || "Request failed");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "Unable to submit attendance." });
    } finally {
      setLoading(false);
    }
  }

  const todayHuman = React.useMemo(() => {
    const d = new Date(today + "T00:00:00");
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(d);
  }, [today]);

  const disabledCheckIn = loading || isCheckedIn;
  const disabledCheckOut = loading || !isCheckedIn || isCheckedOut;

return (
    <>
    <Sheet open={false} onOpenChange={() => {}}>
      <SheetTrigger asChild>
        <Card
          id="attendance-section"
          className="rounded-2xl border-gray-100 p-3 shadow-xl cursor-pointer select-none"
          role="button"
          tabIndex={0}
          onClick={() => console.log("[Attendance] click card trigger")}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              console.log("[Attendance] key trigger -> open");
              setOpen(true);
            }
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500">{todayHuman}</p>
              <p className="truncate text-sm font-medium text-gray-900">{statusText}</p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                <span className="relative inline-flex h-2 w-2 items-center justify-center">
                  <span className="absolute inline-flex h-2 w-2 animate-pulse rounded-full bg-[#23A1A0]/70"></span>
                </span>
                {lat != null && lng != null ? (
                  <span>
                    Lat {lat?.toFixed?.(6)} • Lng {lng?.toFixed?.(6)}
                  </span>
                ) : (
                  <span>Loc unavailable</span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex h-9 items-center rounded-xl bg-[#093A58] px-4 text-xs font-medium text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#23A1A0]"
              >
                {open ? "Close Attendance" : "Attendance"}
              </button>

              {false && (
                <AttendanceCard
                  className="w-[380px] border border-gray-200 shadow-md"
                  onSuccess={(data) => {
                    console.log("✅ Attendance saved:", data);
                    setOpen(false); // otomatis tutup setelah sukses, opsional
                  }}
                />
              )}
            </div>
          </div>
        </Card>
      </SheetTrigger>
      <SheetContent side="bottom" className="relative rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">Take Attendance</SheetTitle>
          <SheetDescription>Update your attendance for today</SheetDescription>
        </SheetHeader>
        <LoaderOverlay show={loading} />
        <div className="px-4">
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
            <span>Status: <span className="font-medium text-gray-900">{statusText}</span></span>
            <button
              type="button"
              onClick={refreshLocation}
              className="text-[#23A1A0] underline underline-offset-4 hover:opacity-80"
            >
              Refresh location
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            <label className="text-sm font-medium text-gray-700">Location Note (optional)</label>
            <Textarea
              placeholder="e.g., WFO - HQ 5th floor"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-[11px] text-gray-500">
              {lat != null && lng != null ? (
                <>Lat {lat?.toFixed?.(6)} • Lng {lng?.toFixed?.(6)}</>
              ) : (
                <>Location not captured</>
              )}
            </p>
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
        </div>

        <SheetFooter>
          <div className="flex w-full gap-2">
            <Button
              onClick={() => getOrSetAttendance({ mode: "checkin" })}
              disabled={disabledCheckIn}
              className="h-10 flex-1 rounded-xl bg-[#093A58] text-white hover:brightness-110"
            >
              Check In
            </Button>
            <Button
              onClick={() => getOrSetAttendance({ mode: "checkout" })}
              disabled={disabledCheckOut}
              variant="outline"
              className="h-10 flex-1 rounded-xl border-[#23A1A0] text-[#093A58] hover:bg-[#23A1A0]/10"
            >
              Check Out
            </Button>
          </div>
          {!employeeId && (
            <p className="px-1 text-xs text-amber-600">You are not signed in or employee profile is missing.</p>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>

    {/* Dedicated modal attendance card */}
    <AttendanceCard
      variant="modal"
      open={open}
      onClose={() => setOpen(false)}
      onSuccess={(data) => {
        console.log('[Attendance] saved via modal:', data);
        setOpen(false);
        setAttendance(data as any);
      }}
    />
    </>
  );
}
