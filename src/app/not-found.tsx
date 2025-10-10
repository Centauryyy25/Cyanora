import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-svh w-full bg-gradient-to-b from-[#F4F8FB] to-[#E9F2F7] dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl text-center">
        <div className="pointer-events-none absolute -inset-6 -z-10 blur-2xl opacity-40" aria-hidden>
          <div className="mx-auto h-56 w-56 rounded-full bg-[#23A1A0]/40" />
        </div>

        <img
          src="/images/White_Cynora.png"
          alt="Cyanora"
          className="mx-auto mb-6 h-10 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] dark:opacity-90"
        />

        <h1 className="text-7xl font-extrabold tracking-tight text-[#093A58] dark:text-white select-none">
          404
        </h1>
        <p className="mt-3 text-lg text-[#093A58]/70 dark:text-slate-300">
          Halaman yang kamu cari tidak ditemukan atau sudah dipindahkan.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild className="bg-[#093A58] hover:bg-[#0B4A76]">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#093A58] text-[#093A58] hover:bg-[#093A58]/10">
            <Link href="/login">Login</Link>
          </Button>
        </div>

        <div className="mt-10 text-xs text-[#093A58]/60 dark:text-slate-400">
          Jika menurutmu ini kesalahan, hubungi administrator.
        </div>
      </div>
    </main>
  );
}

