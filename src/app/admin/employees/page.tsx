"use client";

import * as React from "react";
import { RoleGuard } from "@/components/role-guard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { useEmployees } from "@/hooks/use-employees";
import { supabaseBrowser } from "@/lib/supabase-browser";
import NavigationBar from "@/components/ui/navigation-bar";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";

type Option = { id: number; label: string };

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

type EditorProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  editingId?: number | null;
  defaults?: Partial<{
    nik: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    address: string | null;
    photo_url: string | null;
    join_date: string;
    employment_status: "ACTIVE" | "PROBATION" | "INACTIVE";
    department_id: number;
    position_id: number;
  }>;
};

function AdminEmployeeEditor({ open, onOpenChange, onSaved, editingId, defaults = {} }: EditorProps) {
  const [busy, setBusy] = React.useState(false);
  const [dept, setDept] = React.useState<Option[]>([]);
  const [pos, setPos] = React.useState<Option[]>([]);
  const [form, setForm] = React.useState({
    nik: defaults.nik || "",
    full_name: defaults.full_name || "",
    email: defaults.email || "",
    phone_number: defaults.phone_number || "",
    address: defaults.address || "",
    photo_url: defaults.photo_url || "",
    join_date: defaults.join_date || new Date().toISOString().slice(0, 10),
    employment_status: (defaults.employment_status || "ACTIVE") as "ACTIVE" | "PROBATION" | "INACTIVE",
    department_id: (defaults.department_id as number) || 0,
    position_id: (defaults.position_id as number) || 0,
  });

  // Load existing row when editing
  React.useEffect(() => {
    let mounted = true;
    async function loadExisting() {
      if (!editingId || !supabaseBrowser) return;
      try {
        const { data, error } = await supabaseBrowser
          .from("employees")
          .select("nik, full_name, email, phone_number, address, photo_url, join_date, employment_status, department_id, position_id")
          .eq("id", editingId)
          .maybeSingle();
        if (error) throw error;
        if (!mounted || !data) return;
        setForm({
          nik: (data as any).nik || "",
          full_name: (data as any).full_name || "",
          email: (data as any).email || "",
          phone_number: (data as any).phone_number || "",
          address: (data as any).address || "",
          photo_url: (data as any).photo_url || "",
          join_date: (data as any).join_date || new Date().toISOString().slice(0, 10),
          employment_status: ((data as any).employment_status || "ACTIVE") as any,
          department_id: Number((data as any).department_id) || 0,
          position_id: Number((data as any).position_id) || 0,
        });
      } catch {}
    }
    loadExisting();
    return () => { mounted = false; };
  }, [editingId]);

  React.useEffect(() => {
    let mounted = true;
    async function loadOpts() {
      try {
        if (!supabaseBrowser) return;
        const [dres, pres] = await Promise.all([
          supabaseBrowser.from("departments").select("id,name").order("name", { ascending: true }),
          supabaseBrowser.from("positions").select("id,title").order("title", { ascending: true }),
        ]);
        if (!mounted) return;
        setDept((dres.data || []).map((r: any) => ({ id: r.id, label: r.name })));
        setPos((pres.data || []).map((r: any) => ({ id: r.id, label: r.title })));
      } catch {}
    }
    loadOpts();
    return () => { mounted = false; };
  }, []);

  const onSubmit = async () => {
    try {
      setBusy(true);
      const payload = { ...form, department_id: Number(form.department_id), position_id: Number(form.position_id) };
      const url = editingId ? `/api/admin/employees/${editingId}` : "/api/admin/employees";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Gagal menyimpan (${res.status})`);
      onSaved();
      onOpenChange(false);
    } catch (e: any) {
      alert(e?.message || "Gagal menyimpan data");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="relative rounded-t-2xl border-gray-100">
        <SheetHeader>
          <SheetTitle className="text-[#093A58]">{editingId ? "Edit Karyawan" : "Tambah Karyawan"}</SheetTitle>
          <SheetDescription>Kelola data karyawan. Wajib Admin.</SheetDescription>
        </SheetHeader>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">NIK</label>
            <Input value={form.nik} onChange={(e) => setForm({ ...form, nik: e.target.value })} placeholder="NIK" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Nama Lengkap</label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nama" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Email</label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">No. HP</label>
            <Input value={form.phone_number || ""} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="08xxxxx" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Alamat</label>
            <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Foto URL</label>
            <Input value={form.photo_url || ""} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Tanggal Masuk</label>
            <Input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Status</label>
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm" value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value as any })}>
              <option value="ACTIVE">Active</option>
              <option value="PROBATION">Probation</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Departemen</label>
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: Number(e.target.value) })}>
              <option value={0} disabled>Pilih Departemen</option>
              {dept.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-gray-500">Jabatan</label>
            <select className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm" value={form.position_id} onChange={(e) => setForm({ ...form, position_id: Number(e.target.value) })}>
              <option value={0} disabled>Pilih Jabatan</option>
              {pos.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        <SheetFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Batal</Button>
          <Button onClick={onSubmit} disabled={busy}>{editingId ? "Simpan Perubahan" : "Tambah"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminEmployeesPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [q, setQ] = React.useState("");
  const { employees, isLoading, error, refresh } = useEmployees({ q, status: "ALL" });
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<null | any>(null);

  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", month: "short", day: "numeric" }).format(new Date());
  React.useEffect(() => {
    const id = Number(search?.get("edit"));
    if (Number.isFinite(id) && id > 0) {
      setEditing({ id });
      setEditorOpen(true);
    }
  }, [search]);

  const onAdd = () => { setEditing(null); setEditorOpen(true); };
  const onEdit = (row: any) => {
    setEditing({
      id: row.id,
      nik: row.nik || "",
      full_name: row.full_name,
      email: row.email || "",
      phone_number: (row as any).phone_number || "",
      address: (row as any).address || "",
      photo_url: row.avatar_url || "",
      join_date: row.join_date || new Date().toISOString().slice(0, 10),
      employment_status: row.status || "ACTIVE",
      department_id: (row as any).department_id || 0,
      position_id: (row as any).position_id || 0,
    });
    setEditorOpen(true);
  };
  const onDelete = async (id: number) => {
    if (!confirm("Hapus karyawan ini? Tindakan tidak dapat dibatalkan.")) return;
    try {
      const res = await fetch(`/api/admin/employees/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`Gagal menghapus (${res.status})`);
      refresh();
    } catch (e: any) {
      alert(e?.message || "Gagal menghapus");
    }
  };

  return (
    <RoleGuard allow={["Admin"]} redirectTo="/home">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-24 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm/5 text-white/80">{today}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Employee Management</h1>
            </div>
            <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm" />
          </div>

          <div className="absolute inset-x-5 -bottom-10">
            <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Admin • Directory</p>
                  <p className="font-medium text-gray-900">Kelola karyawan</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Input
                    placeholder="Cari nama, email, departemen..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-10 w-full flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus-visible:ring-[#23A1A0]/30"
                  />
                  <Button className="h-10 rounded-xl" onClick={onAdd}>
                    <Plus className="h-4 w-4" /> Tambah
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-screen-md px-5 pt-16">
          <div className="grid grid-cols-1 gap-3">
            {isLoading && (
              <Card className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">Loading…</Card>
            )}
            {!isLoading && error && (
              <Card className="rounded-2xl border border-rose-100 bg-white p-4 text-sm text-rose-600 shadow-sm">{error}</Card>
            )}
            {!isLoading && !error && employees && employees.length === 0 && (
              <Card className="rounded-2xl border border-gray-100 bg-white p-4 text-sm text-gray-500 shadow-sm">Tidak ada data.</Card>
            )}
            {!isLoading && !error && employees && employees.map((emp) => (
              <Card key={emp.id} className="w-full rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={emp.avatar_url ?? undefined} alt={emp.full_name ?? "Employee"} />
                    <AvatarFallback>{initials(emp.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-900 sm:text-base">{emp.full_name ?? "Unnamed"}</p>
                      <span className="text-xs text-[#093A58] font-medium">{emp.status ?? "-"}</span>
                    </div>
                    <p className="truncate text-xs text-gray-500 sm:text-sm">{[emp.position, emp.department].filter(Boolean).join(" · ") || "—"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(emp)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(emp.id)}>
                      <Trash2 className="h-4 w-4" /> Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <NavigationBar homeHref="/home" />

        <AdminEmployeeEditor
          open={editorOpen}
          onOpenChange={(v) => {
            setEditorOpen(v);
            if (!v && search?.get("edit")) {
              router.replace("/admin/employees");
            }
          }}
          onSaved={refresh}
          editingId={editing?.id || null}
          defaults={editing || {}}
        />
      </main>
    </RoleGuard>
  );
}
