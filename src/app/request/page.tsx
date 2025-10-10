import NavigationBar from "@/components/ui/navigation-bar";
import { RequestCenter } from "@/components/request-center";
import { RoleGuard } from "@/components/role-guard";

export default function RequestPage() {
  return (
    <RoleGuard allow={["Karyawan"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request Center</h1>
          <p className="mt-1 text-sm text-white/80">Kelola semua pengajuanmu di sini</p>
        </div>
      </header>
      <section className="mx-auto max-w-screen-md px-5 pt-6">
        <RequestCenter />
      </section>
      <NavigationBar homeHref="/home" />
    </main>
    </RoleGuard>
  );
}
