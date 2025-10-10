import NavigationBar from "@/components/ui/navigation-bar";
import { RoleGuard } from "@/components/role-guard";
import Link from "next/link";
import { Users, CheckCircle2, Settings } from "lucide-react";

export default function AdminHomePage() {
  return (
    <RoleGuard allow={["Admin"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-20 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Admin Console</h1>
          <p className="mt-1 text-sm text-white/80">Manajemen data & konfigurasi</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 -mt-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Link href="/admin/employees" className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">Employees</span>
            </Link>
            <Link href="/hr/approvals" className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">Approvals</span>
            </Link>
            <Link href="/admin/settings" className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm transition hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700">
                <Settings className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">Settings</span>
            </Link>
          </div>
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </RoleGuard>
  );
}

