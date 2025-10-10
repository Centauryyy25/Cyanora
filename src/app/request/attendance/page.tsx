import NavigationBar from "@/components/ui/navigation-bar";
import { AttendanceHistoryAction } from "@/components/attendance-history";
import { PermissionGuard } from "@/components/permission-guard";

export default function RequestAttendancePage() {
  return (
    <PermissionGuard requireAny={["ATTENDANCE_LOG"]} redirectTo="/login">
      <main className="min-h-[100dvh] bg-background pb-24">
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-16 text-white">
        <h1 className="text-2xl font-semibold tracking-tight">Riwayat Kehadiran</h1>
        <p className="mt-1 text-sm text-white/80">Bulan berjalan hingga hari ini</p>
      </header>
      <section className="mx-auto max-w-screen-md px-5 pt-6">
        <AttendanceHistoryAction inline />
      </section>
      <NavigationBar homeHref="/home" />
    </main>
    </PermissionGuard>
  );
}
