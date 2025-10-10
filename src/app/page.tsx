import { LoginForm } from "@/components/login-form";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<div />}> 
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
