  "use client";

  import * as React from "react";
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
  import { supabaseBrowser } from "@/lib/supabase-browser";

  type Option = { id: number; label: string };

  export type AdminEmployeeEditorProps = {
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

  export function AdminEmployeeEditor({ open, onOpenChange, onSaved, editingId, defaults = {} }: AdminEmployeeEditorProps) {
    const [busy, setBusy] = React.useState(false);
    const [dept, setDept] = React.useState<Option[]>([]);
    const [pos, setPos] = React.useState<Option[]>([]);
    const [form, setForm] = React.useState({
      nik: defaults.nik || "",
      full_name: defaults.full_name || "",
      email: defaults.email || "",
      phone_number: (defaults.phone_number as string) || "",
      address: (defaults.address as string) || "",
      photo_url: (defaults.photo_url as string) || "",
      join_date: defaults.join_date || new Date().toISOString().slice(0, 10),
      employment_status: (defaults.employment_status || "ACTIVE") as "ACTIVE" | "PROBATION" | "INACTIVE",
      department_id: (defaults.department_id as number) || 0,
      position_id: (defaults.position_id as number) || 0,
    });

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

    // Load existing row when editing (prefer secure API to avoid RLS hurdles)
    React.useEffect(() => {
      let mounted = true;
      async function loadExisting() {
        if (!editingId) return;
        try {
          const res = await fetch(`/api/admin/employees/${editingId}`, { cache: "no-store" });
          if (!res.ok) throw new Error(`Failed to load (${res.status})`);
          const json = await res.json();
          const data = json?.data;
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
