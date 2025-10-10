"use client";

import * as React from "react";
import Link from "next/link";
import { Plane, Stethoscope, ClipboardList, UserCheck, Receipt, Clock, PlaneTakeoff, GraduationCap, Users } from "lucide-react";

type Feature = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

export function RequestCenter() {
  const [isAdmin, setIsAdmin] = React.useState(false);
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
        const { data } = (await res.json()) as any;
        const roleName: string | null = data?.role?.name ?? null;
        if (!cancelled) setIsAdmin(roleName === "Admin");
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, []);

  const features: Feature[] = [
    { label: "Cuti / Izin", href: "/request/leave", icon: Plane },
    { label: "Sakit", href: "/request/sick", icon: Stethoscope },
    { label: "Assignments", href: "/request/assignments", icon: ClipboardList },
    { label: "Kehadiran", href: "/request/attendance", icon: UserCheck },
    { label: "Reimbursement", href: "/request/reimbursement", icon: Receipt },
    { label: "Overtime", href: "/request/overtime", icon: Clock },
    { label: "Travel Request", href: "/request/travel", icon: PlaneTakeoff },
    { label: "Training", href: "/request/training", icon: GraduationCap },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {(isAdmin ? [{ label: "Manage Karyawan", href: "/admin/employees", icon: Users } as Feature] : []).concat(features).map((f) => (
        <Link
          key={f.href}
          href={f.href}
          className="group relative flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5">
            <f.icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-gray-700">{f.label}</span>
        </Link>
      ))}
    </div>
  );
}
