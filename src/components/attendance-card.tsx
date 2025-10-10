"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, RefreshCcw, Clock } from "lucide-react";

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

export interface AttendanceCardProps
  extends React.ComponentProps<typeof Card> {
  onSuccess?: (row: AttendanceRow) => void;
  variant?: "inline" | "modal";
  open?: boolean;
  onClose?: () => void;
}

export function AttendanceCard({
  className,
  onSuccess,
  variant = "inline",
  open,
  onClose,
  ...rest
}: AttendanceCardProps) {
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [attendance, setAttendance] = React.useState<AttendanceRow | null>(
    null
  );
  const [lat, setLat] = React.useState<number | null>(null);
  const [lng, setLng] = React.useState<number | null>(null);
  const [note, setNote] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const todayHuman = React.useMemo(() => {
    const d = new Date();
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      month: "short",
      day: "numeric",
    }).format(d);
  }, []);

  const statusText = React.useMemo(() => {
    if (!attendance) return "Belum Check In";
    if (attendance.check_out_at) {
      const t = new Date(attendance.check_out_at);
      return `Checked Out ${t.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    if (attendance.check_in_at) {
      const t = new Date(attendance.check_in_at);
      return `Checked In ${t.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "Belum Check In";
  }, [attendance]);

  const isCheckedIn = Boolean(attendance?.check_in_at);
  const isCheckedOut = Boolean(attendance?.check_out_at);

  // employeeId
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        const { data } = (await res.json()) as any;
        const empId: number | null = data?.employee?.id ?? null;
        if (!cancelled) setEmployeeId(empId);
      } catch (e: any) {
        console.warn("[AttendanceCard] resolve employee failed", e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // today's data
  React.useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/attendance/today", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) setAttendance(json?.data ?? null);
      } catch {
        if (!cancelled) setAttendance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  // Geolocation
  React.useEffect(() => {
    if (!navigator?.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
      },
      (e) => {
        console.warn("[AttendanceCard] geolocation error", e?.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
    return () => {
      try {
        navigator.geolocation.clearWatch(id);
      } catch {}
    };
  }, []);

  const refreshLocation = React.useCallback(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  async function submit(mode: "checkin" | "checkout") {
    if (!employeeId) {
      setError("Employee not detected");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, lat, lng, note }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setAttendance(json?.data as AttendanceRow);
      onSuccess?.(json?.data as AttendanceRow);
    } catch (e: any) {
      setError(e?.message || "Unable to submit attendance");
    } finally {
      setLoading(false);
    }
  }

  const content = (
    <Card
      className={[
        "relative w-full max-w-md md:max-w-lg backdrop-blur-sm",
        "rounded-2xl border border-white/60 bg-gradient-to-br from-white to-gray-50 shadow-xl",
        "ring-1 ring-gray-200 p-4 md:p-6 transition-all duration-300 hover:shadow-2xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <CardHeader className="text-center space-y-1">
        <CardTitle className="text-xl md:text-2xl font-semibold text-[#093A58] tracking-tight">
          Attendance
        </CardTitle>
        <CardDescription className="text-sm md:text-base text-gray-600 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1 text-[#23A1A0]">
            <Clock className="h-4 w-4" />
            {todayHuman}
          </div>
          <span className="font-medium text-gray-700">
            Status: <span className="text-[#093A58]">{statusText}</span>
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 mt-3">
        {/* Location block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl bg-gray-50/90 px-4 py-3 text-sm text-gray-600 ring-1 ring-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#23A1A0]" />
            <span>
              {lat != null && lng != null
                ? `Lat ${lat.toFixed(6)} • Lng ${lng.toFixed(6)}`
                : "Lokasi belum terdeteksi"}
            </span>
          </div>
          <button
            type="button"
            onClick={refreshLocation}
            className="flex items-center gap-1 text-[#23A1A0] hover:text-[#187e7d] transition"
          >
            <RefreshCcw className="h-4 w-4" />
            <span className="underline underline-offset-4">Refresh</span>
          </button>
        </div>

        {/* Note field */}
        <div className="grid gap-2 text-left">
          <label className="text-sm font-semibold text-gray-700">
            Catatan Lokasi (opsional)
          </label>
          <Textarea
            placeholder="Contoh: WFO - HQ Lt.5"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-20 rounded-xl border-gray-200 focus-visible:ring-[#23A1A0]/40"
          />
        </div>

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 text-center animate-in fade-in-10">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => submit("checkin")}
            disabled={loading || isCheckedIn}
            className="h-11 rounded-xl bg-[#093A58] text-white font-medium shadow hover:bg-[#0d4b75] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 transition-all"
          >
            Check In
          </Button>
          <Button
            onClick={() => submit("checkout")}
            disabled={loading || !isCheckedIn || isCheckedOut}
            variant="outline"
            className="h-11 rounded-xl border-[#23A1A0] text-[#093A58] font-medium hover:bg-[#23A1A0]/10 focus-visible:ring-2 focus-visible:ring-[#23A1A0]/30 transition-all"
          >
            Check Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (variant === "modal") {
    if (!open) return null;
    const overlay = (
      <div
        className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.currentTarget === e.target) onClose?.();
        }}
      >
        <div className="animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
          {content}
        </div>
      </div>
    );
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      return createPortal(overlay, document.body);
    }
    return overlay;
  }

  return content;
}



