"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Phone,
  MessageCircle,
  Star,
  StarOff,
  Share2,
  UserPlus,
  ArrowLeft,
} from "lucide-react";

type EmployeeRow = {
  id: number;
  user_id: number | null;
  nik: string;
  full_name: string;
  department_id: number;
  position_id: number;
  join_date: string;
  employment_status: "ACTIVE" | "PROBATION" | "INACTIVE";
  email: string;
  phone_number: string | null;
  address: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  status: string;
  position?: { title: string | null } | null;
  department?: { name: string | null } | null;
};

function initialsOf(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function buildVCard(e: EmployeeRow) {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${e.full_name ?? ""}`,
    `N:${e.full_name ?? ""};;;;`,
    e.email ? `EMAIL;TYPE=INTERNET:${e.email}` : "",
    e.phone_number ? `TEL;TYPE=CELL:${e.phone_number}` : "",
    e.department?.name ? `ORG:${e.department.name}` : "",
    e.position?.title ? `TITLE:${e.position.title}` : "",
    e.address ? `ADR;TYPE=HOME:;;${e.address};;;;` : "",
    e.join_date ? `NOTE:Join Date ${e.join_date}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id);
  const [row, setRow] = React.useState<EmployeeRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [favoriteBusy, setFavoriteBusy] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      try {
        if (!supabaseBrowser) throw new Error("Supabase env not configured");
        setLoading(true);
        setError(null);
        const select = `
          id,
          user_id,
          nik,
          full_name,
          department_id,
          position_id,
          join_date,
          employment_status,
          email,
          phone_number,
          address,
          photo_url,
          created_at,
          updated_at,
          deleted_at,
          status,
          position:positions(title),
          department:departments(name)
        `;
        const { data, error } = await supabaseBrowser
          .from("employees")
          .select(select)
          .eq("id", id)
          .single();
        if (error) throw error;
        if (!mounted) return;
        setRow(data as unknown as EmployeeRow);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (!Number.isFinite(id)) return;
    fetchProfile();
    return () => {
      mounted = false;
    };
  }, [id]);

  const onFavoriteToggle = async () => {
    if (!row || !supabaseBrowser) return;
    try {
      setFavoriteBusy(true);
      if (typeof row.is_favorite !== "boolean") {
        alert("Favorite feature is not available (is_favorite column missing).");
        return;
      }
      const next = !row.is_favorite;
      const { error } = await supabaseBrowser
        .from("employees")
        .update({ is_favorite: next })
        .eq("id", row.id);
      if (error) throw error;
      setRow({ ...row, is_favorite: next });
    } catch (e) {
      console.error("toggle favorite error", e);
      alert("Gagal mengubah favorit. Pastikan kolom is_favorite ada dan RLS mengizinkan update.");
    } finally {
      setFavoriteBusy(false);
    }
  };

  const onDownloadVCF = () => {
    if (!row) return;
    const vcf = buildVCard(row);
    const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${row.full_name || "contact"}.vcf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const onShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.share) {
        await navigator.share({ title: row?.full_name || "Profile", url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert("Profile link copied to clipboard");
      }
    } catch (e) {
      console.error("share failed", e);
    }
  };

  return (
    <div className="min-h-[100dvh] p-4 pb-24 mx-auto max-w-screen-sm">
      <div className="mb-4">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {loading && (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-full" />
            ))}
          </div>
        </Card>
      )}

      {!loading && error && (
        <Card className="p-4 text-sm text-destructive">{error}</Card>
      )}

      {!loading && !error && row && (
        <>
          <Card className="p-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={row.photo_url ?? undefined} alt={row.full_name} />
                <AvatarFallback className="text-lg">{initialsOf(row.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold truncate">{row.full_name}</h1>
                <p className="text-sm text-muted-foreground truncate">
                  {row.position?.title || "—"}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <Button variant="outline" className="gap-2" asChild>
                <a href={row.email ? `mailto:${row.email}` : "#"}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a href={row.phone_number ? `tel:${row.phone_number}` : "#"}>
                  <Phone className="h-4 w-4" /> Call
                </a>
              </Button>
              <Button variant="outline" className="gap-2" asChild>
                <a
                  href={row.phone_number ? `https://wa.me/${row.phone_number}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </Button>
              <Button
                variant={row?.is_favorite ? "default" : "outline"}
                className="gap-2"
                onClick={onFavoriteToggle}
                disabled={favoriteBusy || typeof row?.is_favorite !== "boolean"}
                title={typeof row?.is_favorite !== "boolean" ? "Favorite unavailable" : undefined}
              >
                {row.is_favorite ? (
                  <Star className="h-4 w-4 fill-current" />
                ) : (
                  <StarOff className="h-4 w-4" />
                )}
                Favorite
              </Button>
            </div>
          </Card>

          <Card className="p-5 mt-4 space-y-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Email</p>
              <div className="mt-1 text-sm">
                <p>{row.email || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Phone number</p>
              <p className="mt-1 text-sm">{row.phone_number || "—"}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Team</p>
                <p className="mt-1 text-sm">{row.department?.name || "—"}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Position</p>
                <p className="mt-1 text-sm">{row.position?.title || "—"}</p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Address</p>
              <p className="mt-1 text-sm whitespace-pre-wrap">{row.address || "—"}</p>
            </div>
          </Card>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button className="rounded-full gap-2" variant="secondary" onClick={onDownloadVCF}>
              <UserPlus className="h-4 w-4" /> Add to contact
            </Button>
            <Button className="rounded-full gap-2" variant="default" onClick={onShare}>
              <Share2 className="h-4 w-4" /> Share
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
