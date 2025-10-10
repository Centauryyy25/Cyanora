import NavigationBar from "@/components/ui/navigation-bar";
import { SickLeaveAction } from "@/components/sick-leave";
import { RoleGuard } from "@/components/role-guard";

export default function RequestSickPage() {
  return (
    <RoleGuard allow={["Karyawan"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
        <h1 className="text-2xl font-semibold tracking-tight">Sakit</h1>
        <p className="mt-1 text-sm text-white/80">Ajukan izin sakit</p>
      </header>
      <section className="mx-auto max-w-screen-md px-5 pt-6">
        <SickLeaveAction inline />
      </section>
      <NavigationBar homeHref="/home" />
    </main>
    </RoleGuard>
  );
}
