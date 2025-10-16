import * as React from "react";
import { LoginForm } from "@/components/login-form";
import OurTeam from "@/components/our-team";

export default function Home() {
  return (
    <div className="min-h-svh bg-muted">
      <div className="flex min-h-svh flex-col">
        <main className="h-svh h-full flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm md:max-w-4xl">
            <React.Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}>
              <LoginForm />
            </React.Suspense>
          </div>
        </main>
        <OurTeam />
      </div>
    </div>
  );
}

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
