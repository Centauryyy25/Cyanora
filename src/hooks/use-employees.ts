"use client";

import * as React from "react";
import type { Employee } from "@/lib/supabase";

export type UseEmployeesParams = {
  q?: string;
  status?: "ACTIVE" | "PROBATION" | "INACTIVE" | "ALL";
};

export function useEmployees({ q = "", status = "ALL" }: UseEmployeesParams) {
  const [data, setData] = React.useState<Employee[] | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    async function run() {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (status && status !== "ALL") params.set("status", status);
        const url = `/api/employees${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url, { signal: ac.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = (await res.json()) as { data?: Employee[]; error?: string };
        if (json.error) throw new Error(json.error);
        setData(json.data ?? []);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Unknown error");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }
    run();
    return () => ac.abort();
  }, [q, status]);

  return { employees: data, isLoading, error } as const;
}

