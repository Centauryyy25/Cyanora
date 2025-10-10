"use client";

import { useCallback, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";

type Props = {
  idleMs?: number;
  pingMs?: number;
};

// Auto-logout after a period of user inactivity across tabs.
// Uses BroadcastChannel to sync last activity across tabs.
export default function IdleTimeout({ idleMs = 15 * 60_000, pingMs = 30_000 }: Props) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const schedule = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const dueIn = Math.max(0, idleMs - (Date.now() - lastActivityRef.current));
    timerRef.current = setTimeout(async () => {
      try {
        // Clear custom app_session cookie (if present) and NextAuth session
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
        await signOut({ redirect: false }).catch(() => {});
      } finally {
        window.location.href = "/login";
      }
    }, dueIn);
  }, [idleMs]);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    schedule();
    try {
      bcRef.current?.postMessage({ t: lastActivityRef.current });
    } catch {}
  }, [schedule]);

  useEffect(() => {
    bcRef.current = new BroadcastChannel("idle-timeout");
    const bc = bcRef.current;
    bc.onmessage = (e) => {
      const t = Number(e?.data?.t);
      if (Number.isFinite(t) && t > lastActivityRef.current) {
        lastActivityRef.current = t;
        schedule();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") markActivity();
    };

    const listeners: Array<[string, EventListener]> = [
      ["mousemove", markActivity as EventListener],
      ["mousedown", markActivity as EventListener],
      ["keydown", markActivity as EventListener],
      ["scroll", markActivity as EventListener],
      ["click", markActivity as EventListener],
      ["visibilitychange", onVisibility as EventListener],
    ];
    listeners.forEach(([evt, fn]) => window.addEventListener(evt, fn, { passive: true } as any));

    // Background ping to keep timers aligned and allow refresh-token strategies
    const p = setInterval(() => {
      // Only reschedule to keep timer drift low; do not ping server aggressively
      schedule();
    }, pingMs);

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(p);
      listeners.forEach(([evt, fn]) => window.removeEventListener(evt, fn));
      try {
        bc.close();
      } catch {}
    };
  }, [markActivity, pingMs, schedule]);

  return null;
}

