"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { getSupabaseSafe } from "@/lib/supabase-client-safe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Bell, ChevronDown } from "lucide-react";

type Props = {
  label?: string;
  style?: React.CSSProperties;
};

type Announcement = {
  id: number;
  title: string;
  content: string;
  published_at: string | null;
  pinned: boolean;
};

type ApprovalLog = {
  id: number;
  action: "PENDING" | "APPROVED" | "REJECTED";
  step: "HR" | "ADMIN";
  note: string | null;
  approved_at: string | null;
  leave_requests: {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    status: string;
  } | null;
};

type Item =
  | { kind: "announcement"; id: string; title: string; when: string | null; body: string; pinned: boolean }
  | { kind: "approval"; id: string; title: string; when: string | null; body: string; detail: ApprovalLog };

function fmtDateTime(s: string | null) {
  if (!s) return null;
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(new Date(s));
  } catch {
    return s;
  }
}

function excerpt(text: string, len = 160) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}

export function InboxAction({ label = "Inbox", style }: Props) {
  const [open, setOpen] = React.useState(false);
  const [employeeId, setEmployeeId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<Item[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [openSet, setOpenSet] = React.useState<Set<string>>(new Set());
  const [filter, setFilter] = React.useState<"ALL" | "ANN" | "APP">("ALL");

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
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!open) return;
    let supabase: SupabaseClient | null = null;
    try {
      supabase = getSupabaseSafe();
    } catch (e: any) {
      setError(e?.message || "Supabase belum dikonfigurasi.");
      return;
    }
    const client: SupabaseClient = supabase as SupabaseClient;
    setLoading(true);
    setError(null);
    let cancelled = false;
    async function load() {
      try {
        const nowIso = new Date().toISOString();
        // Fix: Added await to resolve PostgrestFilterBuilder type
        const annRes = await client
          .from("announcements")
          .select("id,title,content,published_at,pinned,status,deleted_at")
          .eq("status", "PUBLISHED")
          .is("deleted_at", null)
          .lte("published_at", nowIso)
          .order("pinned", { ascending: false })
          .order("published_at", { ascending: false })
          .limit(20);

        // Fix: Added await to resolve PostgrestFilterBuilder type
        let apprRes: { data: any; error: any } = { data: [], error: null };
        if (employeeId) {
          apprRes = await client
            .from("approval_logs")
            .select(
              "id,action,step,note,approved_at,leave_requests!inner(id,employee_id,leave_type,start_date,end_date,status)"
            )
            .eq("leave_requests.employee_id", employeeId)
            .neq("action", "PENDING")
            .order("approved_at", { ascending: false })
            .limit(50);
        }

        if (annRes.error) throw annRes.error;
        if ((apprRes as any).error) throw (apprRes as any).error;

        const annList = (annRes.data ?? []).map((r: any) => ({
          kind: "announcement",
          id: `ann-${r.id}`,
          title: r.title as string,
          when: fmtDateTime(r.published_at),
          body: excerpt(String(r.content ?? "")),
          pinned: !!r.pinned,
        })) as Item[];

        const apprRows = ((apprRes as any).data ?? []) as ApprovalLog[];
        const apprList = apprRows.map((r) => {
          const lr = r.leave_requests;
          const title = `Pengajuan ${lr?.leave_type === "CUTI_TAHUNAN" ? "Cuti" : lr?.leave_type} ${r.action}`;
          const body = lr ? `${lr.start_date} – ${lr.end_date}` : "";
          return {
            kind: "approval",
            id: `appr-${r.id}`,
            title,
            when: fmtDateTime(r.approved_at),
            body,
            detail: r,
          } as Item;
        });

        const merged = [...annList, ...apprList].sort((a, b) => {
          const at = (a.when ? Date.parse(a.when) : 0);
          const bt = (b.when ? Date.parse(b.when) : 0);
          return bt - at;
        });
        if (!cancelled) setItems(merged);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Gagal memuat inbox.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open, employeeId]);

  const filtered = React.useMemo(() => {
    if (filter === "ALL") return items;
    if (filter === "ANN") return items.filter((i) => i.kind === "announcement");
    return items.filter((i) => i.kind === "approval");
  }, [items, filter]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
          style={style}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
            <Bell className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-xs font-medium text-gray-700">{label}</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">Inbox</SheetTitle>
          <SheetDescription>Pengumuman dan notifikasi approval</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-3">
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5">
            {(["ALL","ANN","APP"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`h-8 rounded-md px-2 text-xs transition ${filter === s ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {s === "ALL" ? "Semua" : s === "ANN" ? "Pengumuman" : "Approval"}
              </button>
            ))}
          </div>
        </div>
        <div className="max-h-[55dvh] overflow-y-auto px-4 pb-4">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">{error}</div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Tidak ada notifikasi.
            </div>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-2">
              {filtered.map((it) => {
                const isOpen = openSet.has(it.id);
                const toggle = () => setOpenSet((prev) => { const next = new Set(prev); next.has(it.id) ? next.delete(it.id) : next.add(it.id); return next; });
                return (
                  <div key={it.id} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                    <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-3 p-3 text-left">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{it.title}</p>
                        {it.when && <p className="text-[11px] text-gray-500">{it.when}</p>}
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : "rotate-0"}`} />
                    </button>
                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-gray-700">
                        <div className="rounded-lg bg-gray-50 p-2">
                          <p className="text-[11px] text-gray-500">Ringkasan</p>
                          <p className="font-medium text-gray-900">{it.body}</p>
                        </div>
                        {it.kind === "approval" && it.detail?.leave_requests && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[11px] text-gray-500">Jenis</p>
                              <p className="font-medium text-gray-900">{it.detail.leave_requests.leave_type === "CUTI_TAHUNAN" ? "Cuti" : it.detail.leave_requests.leave_type}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[11px] text-gray-500">Periode</p>
                              <p className="font-medium text-gray-900">{it.detail.leave_requests.start_date} – {it.detail.leave_requests.end_date}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[11px] text-gray-500">Step</p>
                              <p className="font-medium text-gray-900">{it.detail.step}</p>
                            </div>
                            <div className="rounded-lg bg-gray-50 p-2">
                              <p className="text-[11px] text-gray-500">Aksi</p>
                              <p className="font-medium text-gray-900">{it.detail.action}</p>
                            </div>
                            {it.detail.note && (
                              <div className="col-span-2 rounded-lg bg-gray-50 p-2">
                                <p className="text-[11px] text-gray-500">Catatan</p>
                                <p className="font-medium text-gray-900">{it.detail.note}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
