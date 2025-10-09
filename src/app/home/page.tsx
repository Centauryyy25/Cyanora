import NavigationBar from "@/components/ui/navigation-bar";
import {
  CalendarCheck,
  Trophy,
  Newspaper,
  LineChart,
  Users,
  ClipboardList,
} from "lucide-react";

export default function HomePage() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const features = [
    { label: "Ask Leave", icon: CalendarCheck },
    { label: "Leaderboard", icon: Trophy },
    { label: "News", icon: Newspaper },
    { label: "Predictor", icon: LineChart },
    { label: "Friends", icon: Users },
    { label: "Assignments", icon: ClipboardList },
  ];

  return (
    <main className="min-h-[100dvh] bg-white pb-24">
      {/* Header with gradient and greeting */}
      <header className="relative rounded-b-3xl bg-gradient-to-br from-[#093A58] to-[#23A1A0] px-5 pt-10 pb-24 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm/5 text-white/80">{today}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Welcome back, Ilham 👋
            </h1>
          </div>
          {/* Avatar placeholder */}
          <div className="h-10 w-10 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 backdrop-blur-sm" />
        </div>

        {/* Attendance quick action card overlay */}
        <div className="absolute inset-x-5 -bottom-10">
          <div className="rounded-2xl bg-white p-4 shadow-xl ring-1 ring-black/5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Today</p>
                <p className="font-medium text-gray-900">Take Attendance Today</p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <input
                  type="text"
                  placeholder="Add note (optional)"
                  className="h-10 w-full flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm outline-none transition focus:border-[#23A1A0] focus:ring-2 focus:ring-[#23A1A0]/30"
                />
                <button
                  type="button"
                  className="h-10 shrink-0 rounded-xl bg-[#23A1A0] px-4 text-sm font-medium text-white shadow-md transition active:scale-[0.98] hover:brightness-105"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-screen-md px-5 pt-16">
        {/* Weekly status + Analytics in responsive grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Weekly status left */}
          <div className="md:col-span-7">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Weekly Status</h2>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              {/* Days Row */}
              <div className="flex items-center justify-between">
                {[
                  { d: "Mon", s: "✔️", c: "text-emerald-600" },
                  { d: "Tue", s: "✔️", c: "text-emerald-600" },
                  { d: "Wed", s: "❌", c: "text-rose-600" },
                  { d: "Thu", s: "A", c: "text-amber-600" },
                  { d: "Fri", s: "✔️", c: "text-emerald-600" },
                ].map((x) => (
                  <div key={x.d} className="flex flex-col items-center">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-sm font-semibold ring-1 ring-gray-200">
                      <span className={x.c}>{x.s}</span>
                    </div>
                    <span className="mt-1 text-xs text-gray-500">{x.d}</span>
                  </div>
                ))}
              </div>
              {/* Subtle baseline */}
              <div className="mt-4 h-[2px] w-full rounded-full bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              <p className="mt-3 text-xs text-gray-500">✔️ Present • ❌ Absent • A Leave</p>
            </div>
          </div>

          {/* Analytics right */}
          <div className="md:col-span-5">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Analytics</h2>
            <div className="grid grid-cols-3 gap-3">
              {/* Attendance progress */}
              <div className="group rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="relative h-16 w-16">
                    <svg viewBox="0 0 36 36" className="h-16 w-16">
                      <path
                        className="stroke-gray-200"
                        strokeWidth="3.5"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="stroke-[#23A1A0]"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray="83, 100"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 grid place-items-center">
                      <span className="text-sm font-semibold text-gray-900">83%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Attendance</p>
                </div>
              </div>

              {/* Leave Taken */}
              <div className="group rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#23A1A0]/10 text-[#23A1A0]">
                  <span className="text-xl font-semibold">03</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Leave Taken</p>
              </div>

              {/* Ongoing Days */}
              <div className="group rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm transition hover:shadow-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#093A58]/10 text-[#093A58]">
                  <span className="text-xl font-semibold">23</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">Ongoing Days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {features.map((f) => (
              <button
                key={f.label}
                type="button"
                className="group flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm outline-none transition hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#23A1A0]/40 focus-visible:ring-offset-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition group-hover:border-[#23A1A0]/40 group-hover:text-[#23A1A0] group-active:scale-95">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-gray-700">{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom navigation - keep existing component and layout */}
      <NavigationBar />
    </main>
  );
}
