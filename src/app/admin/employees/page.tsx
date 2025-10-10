import NavigationBar from "@/components/ui/navigation-bar";
import { RoleGuard } from "@/components/role-guard";

export default function AdminEmployeesPage() {
  return (
    <RoleGuard allow={["Admin"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Manage Employees</h1>
          <p className="mt-1 text-sm text-white/80">CRUD data karyawan (coming soon)</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 pt-6">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Halaman admin untuk mengubah data karyawan akan tersedia di sini.
          </div>
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </RoleGuard>
  );
}

