"use client";

import * as React from "react";
import NavigationBar from "@/components/ui/navigation-bar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployees } from "@/hooks/use-employees";

type Status = "ALL" | "ACTIVE" | "PROBATION" | "INACTIVE";

const statusOptions: { label: string; value: Status }[] = [
  { label: "All", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Probation", value: "PROBATION" },
  { label: "Inactive", value: "INACTIVE" },
];

function StatusBadge({ value }: { value: Exclude<Status, "ALL"> | null | undefined }) {
  const map: Record<Exclude<Status, "ALL">, string> = {
    ACTIVE: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    PROBATION: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    INACTIVE: "bg-muted text-muted-foreground border-transparent",
  };
  const label: Record<Exclude<Status, "ALL">, string> = {
    ACTIVE: "Active",
    PROBATION: "Probation",
    INACTIVE: "Inactive",
  };
  if (!value) return null;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${map[value]}`}>
      {label[value]}
    </span>
  );
}

function EmployeeRow({
  full_name,
  position,
  department,
  status,
  avatar_url,
}: {
  full_name: string | null;
  position: string | null;
  department: string | null;
  status: Exclude<Status, "ALL"> | null;
  avatar_url: string | null | undefined;
}) {
  const initials = (full_name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card className="w-full rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <Avatar className="h-11 w-11">
          <AvatarImage src={avatar_url ?? undefined} alt={full_name ?? "Employee"} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-gray-900 sm:text-base">{full_name ?? "Unnamed"}</p>
            <StatusBadge value={status} />
          </div>
          <p className="truncate text-xs text-gray-500 sm:text-sm">
            {[position, department].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EmployeeRowSkeleton() {
  return (
    <Card className="w-full rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </Card>
  );
}

export default function EmployedPage() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<Status>("ALL");
  const { employees, isLoading, error } = useEmployees({ q, status });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-[100dvh] bg-white pb-24">
      {/* Header matching Home styling */}
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-24 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm/5 text-white/80">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Employees</h1>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm" />
        </div>

        {/* Search/filter overlay card */}
        <div className="absolute inset-x-5 -bottom-10">
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Directory</p>
                <p className="font-medium text-gray-900">Find team members</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Input
                  placeholder="Search name, position, department..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-10 w-full flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus-visible:ring-[#23A1A0]/30"
                />
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 shadow-sm outline-none transition focus:border-[#23A1A0] focus:ring-2 focus:ring-[#23A1A0]/30"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-screen-md px-5 pt-16">
        <div className="grid grid-cols-1 gap-3">
          {isLoading && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <EmployeeRowSkeleton key={i} />
              ))}
            </>
          )}

          {!isLoading && error && (
            <Card className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">{error}</Card>
          )}

          {!isLoading && !error && employees && employees.length === 0 && (
            <Card className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">No employees found.</Card>
          )}

          {!isLoading && !error && employees &&
            employees.map((emp) => (
              <EmployeeRow
                key={emp.id}
                full_name={emp.full_name}
                position={emp.position}
                department={emp.department}
                status={(emp.status ?? null) as any}
                avatar_url={emp.avatar_url}
              />
            ))}
        </div>
      </section>

      <NavigationBar homeHref="/home" />
    </main>
  );
}
