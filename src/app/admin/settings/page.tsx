import NavigationBar from "@/components/ui/navigation-bar";
import { PermissionGuard } from "@/components/permission-guard";

export default function AdminSettingsPage() {
  return (
    <PermissionGuard requireAny={["EMP_VIEW", "USER_CREATE", "EMP_EDIT"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-white/80">Konfigurasi aplikasi (coming soon)</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 pt-6">
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Pengaturan admin akan tersedia di sini.
          </div>
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </PermissionGuard>
  );
}
