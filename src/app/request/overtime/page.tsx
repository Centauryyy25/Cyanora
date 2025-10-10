import NavigationBar from "@/components/ui/navigation-bar";

export default function OvertimeComingSoonPage() {
  return (
    <main className="min-h-[100dvh] bg-background pb-24">
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-20 text-white">
        <h1 className="text-2xl font-semibold tracking-tight">Overtime</h1>
        <p className="mt-1 text-sm text-white/80">Lembur akan tersedia segera</p>
      </header>
      <section className="mx-auto max-w-screen-md px-5">
        <div className="grid min-h-[45dvh] place-items-center py-8">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 ring-1 ring-black/5" />
            <h2 className="text-lg font-semibold text-gray-900">Coming Soon</h2>
            <p className="mt-1 text-sm text-gray-600">Fitur pengajuan lembur sedang dalam pengembangan.</p>
          </div>
        </div>
      </section>
      <NavigationBar homeHref="/home" />
    </main>
  );
}
