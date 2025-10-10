"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import IdleTimeout from "@/components/idle-timeout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleTimeout idleMs={15 * 60_000} />
      {children}
    </SessionProvider>
  );
}
