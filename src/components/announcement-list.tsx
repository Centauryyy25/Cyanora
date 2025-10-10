"use client";

import * as React from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Announcement = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  published_at: string | null;
};

function formatDate(s: string | null) {
  if (!s) return "";
  const d = new Date(s);
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function excerpt(text: string, len = 180) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > len ? t.slice(0, len - 1) + "…" : t;
}

export function AnnouncementList() {
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<Announcement[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!supabaseBrowser) {
        setError("Supabase belum dikonfigurasi.");
        setRows([]);
        return;
      }
      const nowIso = new Date().toISOString();
      const { data, error } = await supabaseBrowser
        .from("announcements")
        .select("id,title,content,pinned,published_at,status,deleted_at")
        .eq("status", "PUBLISHED")
        .is("deleted_at", null)
        .lte("published_at", nowIso)
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false });
      if (error) throw error;
      const list = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        pinned: !!r.pinned,
        published_at: r.published_at,
      })) as Announcement[];
      setRows(list);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat pengumuman.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">
        {error}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Belum ada pengumuman.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((a) => (
        <article key={a.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <header className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {a.title}
              {a.pinned && (
                <span className="ml-2 align-middle text-[10px] font-medium text-amber-600">Pinned</span>
              )}
            </h3>
            <time className="shrink-0 text-xs text-gray-500">{formatDate(a.published_at)}</time>
          </header>
          <p className="mt-2 text-sm text-gray-700">{excerpt(a.content)}</p>
        </article>
      ))}
    </div>
  );
}

