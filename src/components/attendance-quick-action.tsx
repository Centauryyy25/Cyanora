"use client";

import * as React from "react";
import { UserCheck } from "lucide-react";

export function AttendanceQuickAction({ style }: { style?: React.CSSProperties }) {
  const onClick = React.useCallback(() => {
    console.log("[AttendanceQuickAction] click tile");
    try {
      document.getElementById("attendance-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {}
    try {
      console.log("[AttendanceQuickAction] dispatch open-attendance");
      window.dispatchEvent(new Event("open-attendance"));
    } catch {}
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
      style={style}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
        <UserCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <span className="text-xs font-medium text-gray-700">Kehadiran</span>
    </button>
  );
}
