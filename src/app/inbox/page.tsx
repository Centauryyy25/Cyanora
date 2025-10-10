import NavigationBar from "@/components/ui/navigation-bar";
import { InboxList } from "@/components/inbox-list";
import { PermissionGuard } from "@/components/permission-guard";

export default function InboxPage() {
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date());

  return (
    <PermissionGuard requireAny={["LEAVE_REQUEST", "ATTENDANCE_LOG"]} redirectTo="/login">
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-24 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm/5 text-white/80">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inbox</h1>
            <p className="mt-1 text-xs text-white/80">Pengumuman & Notifikasi Approval</p>
          </div>
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm" />
        </div>
      </header>

      <section className="mx-auto max-w-screen-md px-5 pt-16">
        <InboxList />
      </section>

      <NavigationBar homeHref="/home" />
    </main>
    </PermissionGuard>
  );
}
