import NavigationBar from "@/components/ui/navigation-bar";
import { RoleGuard } from "@/components/role-guard";
import { TakeAttendanceSection } from "@/components/take-attendance";
import {
  CalendarCheck,
  Megaphone,
  ClipboardList,
  Stethoscope,
  Plane,
  UserCheck,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { verifyAppJWT } from "@/lib/jwt";
import { AttendanceAnalytics } from "@/components/attendance-analytics";
// Sheet actions are available on Request pages; here we navigate via links for clear URLs
import Link from "next/link";
import { WeeklyStatus } from "@/components/weekly-status";
// import dynamic from "next/dynamic";

// const AttendanceAnalytics = dynamic(
//   () => import("@/components/attendance-analytics").then(mod => mod.AttendanceAnalytics),
//   { ssr: false } // <- sangat penting agar tidak dirender di server
// );

export default async function HomePage() {
  const session = await auth();
  let userName: string | undefined =
    (session?.user?.name as string | undefined) ||
    (session?.user?.email ? String(session.user.email).split("@")[0] : undefined);

  // Fallback to custom app_session cookie if NextAuth session missing name
  if (!userName) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("app_session")?.value;
      if (token) {
        const payload = await verifyAppJWT(token);
        userName = (payload as any)?.employee?.full_name
          || (payload as any)?.username
          || ((payload as any)?.email ? String((payload as any).email).split("@")[0] : undefined);
      }
    } catch {}
  }
  userName = userName || "User";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  const features = [
    { label: "Sakit", icon: Stethoscope },
    { label: "Anouncement", icon: Megaphone },
    { label: "Cuti", icon: Plane },
    { label: "Kehadiran", icon: UserCheck },
    { label: "Assignments", icon: ClipboardList },
    { label: "Ask Leave", icon: CalendarCheck },
  ];

  return (
    <RoleGuard allow={["Karyawan"]} redirectTo="/login">
    <main className="min-h-[100dvh] bg-background pb-24">
      {/* Header with gradient and greeting */}
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-24 text-white animate-in fade-in-50 slide-in-from-top-2 duration-500">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm/5 text-white/80">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Welcome back, {userName} 👋
            </h1>
          </div>
          {/* Avatar placeholder */}
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm" />
        </div>

        {/* Attendance quick action card overlay */}
        <div className="absolute inset-x-5 -bottom-10">
          {/* New Take Attendance section */}
          <div className="shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-500 delay-100">
            <TakeAttendanceSection />
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-screen-md px-5 pt-16">
        {/* Weekly status + Analytics in responsive grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Weekly status left */}
          <div className="md:col-span-7 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-100">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Weekly Status</h2>
            <WeeklyStatus />
          </div>

          {/* Analytics right */}
          <div className="md:col-span-5 animate-in fade-in-50 slide-in-from-bottom-2 duration-500 delay-200">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Analytics</h2>
            <div className="grid grid-cols-1">
              <AttendanceAnalytics />
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3 animate-in fade-in-50 duration-500 delay-300">
            {features.map((f, i) => {
              const style = { animationDelay: `${(i + 1) * 60}ms` } as const;
              if (f.label === "Sakit") {
                return (
                  <Link
                    key={f.label}
                    href="/request/sick"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                    style={style}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </Link>
                );
              }
              if (f.label === "Cuti") {
                return (
                  <Link
                    key={f.label}
                    href="/request/leave"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                    style={style}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </Link>
                );
              }
              if (f.label === "Kehadiran") {
                return (
                  <Link
                    key={f.label}
                    href="/request/attendance"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                    style={style}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </Link>
                );
              }
              if (f.label === "Anouncement") {
                return (
                  <Link
                    key={f.label}
                    href="/announcement"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                    style={style}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </Link>
                );
              }
              if (f.label === "Assignments") {
                return (
                  <Link
                    key={f.label}
                    href="/request/assignments"
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                    style={style}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                      <f.icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </Link>
                );
              }
              
              return (
                <button
                  key={f.label}
                  type="button"
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2 animate-in fade-in-50 zoom-in-95"
                  style={style}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-teal-50 to-cyan-50 text-gray-700 ring-1 ring-black/0 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-hover:ring-black/5 group-active:scale-95">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom navigation - keep existing component and layout */}
      <NavigationBar />
    </main>
    </RoleGuard>
  );
}
