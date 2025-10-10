import NavigationBar from "@/components/ui/navigation-bar";
import { PermissionGuard } from "@/components/permission-guard";
import { TakeAttendanceSection } from "@/components/take-attendance";

export default function AttendancePage() {
  return (
    <PermissionGuard requireAny={["ATTENDANCE_LOG"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
        <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-white/80">Check-in / Check-out hari ini</p>
        </header>
        <section className="mx-auto max-w-screen-md px-5 pt-6">
          <TakeAttendanceSection />
        </section>
        <NavigationBar homeHref="/home" />
      </main>
    </PermissionGuard>
  );
}

