"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={[
        "rounded-full h-9 px-4",
        "border border-[#093A58] text-[#093A58] bg-white",
        "hover:bg-[#093A58]/10",
        className ?? "",
      ].join(" ")}
      variant="outline"
    >
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
