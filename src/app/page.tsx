import * as React from "react";
import { LoginForm } from "@/components/login-form"

export default function Home() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <React.Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
