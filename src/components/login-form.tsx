"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Use public image path to avoid Turbopack ESM static import issues
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || "/home";
  const oauthError = params?.get("error");

  // Prefetch CSRF token so the backend accepts the login request
  const [csrf, setCsrf] = useState<string>("");
  useEffect(() => {
    fetch("/api/auth/csrf", { method: "GET", cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCsrf(j?.token || ""))
      .catch(() => {});
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        // If CSRF failed due to missing token, fetch a fresh one and retry once
        if (res.status === 400 && (json?.error || "").toLowerCase().includes("csrf")) {
          try {
            const t = await fetch("/api/auth/csrf", { cache: "no-store" }).then((r) => r.json());
            const newToken = t?.token || "";
            setCsrf(newToken);
            const retry = await fetch("/api/auth/login", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-CSRF-Token": newToken,
              },
              credentials: "include",
              body: JSON.stringify({ email, password }),
            });
            const rjson = await retry.json();
            if (retry.ok) {
              try {
                const roleName = rjson?.data?.role || null;
                const perms = Array.isArray(rjson?.data?.permissions) ? rjson.data.permissions : [];
                console.debug("Login success (retry)", { role: roleName, permissions: perms });
                console.log(`Role: ${roleName ?? "(tidak ada)"}`, "Permissions:", perms);
              } catch {}
              window.location.assign(callbackUrl);
              return;
            }
            setError(rjson?.error || "Email atau password salah.");
            return;
          } catch {}
        }
        setError(json?.error || "Email atau password salah.");
        return;
      }
      // Debug: tampilkan role & permissions dari response login
      try {
        const roleName = json?.data?.role || null;
        const perms = Array.isArray(json?.data?.permissions) ? json.data.permissions : [];
        console.debug("Login success", { role: roleName, permissions: perms });
        console.log(`Role: ${roleName ?? "(tidak ada)"}`, "Permissions:", perms);
      } catch {}
      // Redirect to callbackUrl (default /home)
      // Hard navigation ensures new cookies are applied before guard runs
      window.location.assign(callbackUrl);
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal login. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2 items-stretch">
          <form className="p-6 md:p-8" onSubmit={onSubmit}>
            <div className="flex flex-col gap-6">
              {/* Removed header to keep form minimal */}
              {(error || oauthError) ? (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error ||
                    (oauthError === "AccessDenied"
                      ? "Akun Google Anda belum terdaftar di sistem. Hubungi admin."
                      : oauthError?.replaceAll("_", " ") || null)}
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[#093A58]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-[#093A58]">Password</Label>
                  <a
                    href="#"
                    className="ml-auto text-sm text-[#093A58] hover:text-[#23A1A0] underline-offset-2 hover:underline decoration-[#093A58] hover:decoration-[#23A1A0]"
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#093A58] text-white hover:bg-[#0B4A76] focus-visible:ring-[#23A1A0]"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-[#093A58]/60">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-[#093A58] text-[#093A58] hover:bg-[#093A58]/10 h-10 justify-center gap-3"
                  onClick={() => signIn("google", { callbackUrl })}
                >
                  {/* Google 'G' icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                  </svg>
                  <span className="text-sm font-medium">Sign in with Google</span>
                </Button>
              </div>
              <div className="text-center text-sm text-[#093A58]/80">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline underline-offset-4 text-[#093A58] hover:text-[#23A1A0]">
                  Sign up
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden md:block h-full bg-muted">
            <img
              src="/images/Cynora_Wallpaper.jpg"
              alt="Cyanora Wallpaper"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              loading="eager"
            />
            <div className="absolute inset-0 bg-black/25" />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-[#093A58]/70">
        By clicking continue, you agree to our
        {" "}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline underline underline-offset-4 text-[#093A58] hover:text-[#23A1A0] decoration-[#093A58] hover:decoration-[#23A1A0] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#23A1A0] rounded-[2px] px-0.5"
            >
              Terms of Service
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg">
            <div className="h-1 w-full bg-gradient-to-r from-[#093A58] to-[#23A1A0]" />
            <SheetHeader>
              <SheetTitle className="bg-gradient-to-r from-[#093A58] to-[#23A1A0] bg-clip-text text-transparent">
                Terms of Service
              </SheetTitle>
              <SheetDescription className="text-[#093A58]/70">
                Please review the terms carefully. This summary is provided for
                convenience and does not replace the full terms.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 pt-0 space-y-6 overflow-y-auto">
              <section className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p className="text-[#093A58] font-medium">Your Commitments</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-[#23A1A0]">
                  <li>
                    Acceptance: By using this application, you agree to comply
                    with these terms and all applicable laws and regulations.
                  </li>
                  <li>
                    Use of Service: Access is provided for authorized users and
                    valid business purposes only. Do not circumvent security or
                    misuse data.
                  </li>
                  <li>
                    Accounts & Security: Keep credentials confidential. You are
                    responsible for activities under your account.
                  </li>
                </ul>
              </section>
              <section className="space-y-3 text-sm leading-7 text-muted-foreground">
                <p className="text-[#093A58] font-medium">Data & Access</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-[#23A1A0]">
                  <li>
                    Data Handling: Data is processed according to our privacy
                    practices. Contact the administrator for inquiries.
                  </li>
                  <li>
                    Termination: We may suspend or terminate access for
                    violations or security concerns.
                  </li>
                </ul>
              </section>
              <div className="rounded-md border border-[#093A58]/10 bg-muted/30 p-4 text-xs text-[#093A58]/70">
                Tip: Reach out to your system administrator for detailed
                contracts or vendor terms.
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline" className="border-[#093A58] text-[#093A58] hover:bg-[#093A58]/10">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        {" "}and{" "}
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline underline underline-offset-4 text-[#093A58] hover:text-[#23A1A0] decoration-[#093A58] hover:decoration-[#23A1A0] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#23A1A0] rounded-[2px] px-0.5"
            >
              Privacy Policy
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-lg">
            <div className="h-1 w-full bg-gradient-to-r from-[#093A58] to-[#23A1A0]" />
            <SheetHeader>
              <SheetTitle className="bg-gradient-to-r from-[#093A58] to-[#23A1A0] bg-clip-text text-transparent">
                Privacy Policy
              </SheetTitle>
              <SheetDescription className="text-[#093A58]/70">
                We respect your privacy. Below is a concise overview of how we
                handle information in this application.
              </SheetDescription>
            </SheetHeader>
            <div className="p-4 pt-0 space-y-6 overflow-y-auto">
              <section className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p className="text-[#093A58] font-medium">What We Collect</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-[#23A1A0]">
                  <li>
                    Account & Usage Data: Information necessary to provide and
                    secure your access.
                  </li>
                  <li>
                    Cookies & Sessions: Secure cookies maintain your sign-in
                    state and preferences.
                  </li>
                </ul>
              </section>
              <section className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p className="text-[#093A58] font-medium">How We Use Data</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-[#23A1A0]">
                  <li>Authentication and authorization.</li>
                  <li>Security, analytics, and service improvements.</li>
                </ul>
              </section>
              <section className="space-y-4 text-sm leading-7 text-muted-foreground">
                <p className="text-[#093A58] font-medium">Sharing & Rights</p>
                <ul className="list-disc pl-5 space-y-2 marker:text-[#23A1A0]">
                  <li>
                    We do not sell data. Providers may process data under
                    strict obligations where necessary.
                  </li>
                  <li>
                    Your Rights: Contact the administrator to access, correct,
                    or delete data where applicable.
                  </li>
                </ul>
              </section>
              <div className="rounded-md border border-[#093A58]/10 bg-muted/30 p-4 text-xs text-[#093A58]/70">
                Note: This overview is informational and may be supplemented by
                internal policies.
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline" className="border-[#093A58] text-[#093A58] hover:bg-[#093A58]/10">
                  Close
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        .
      </div>
    </div>
  )
}
