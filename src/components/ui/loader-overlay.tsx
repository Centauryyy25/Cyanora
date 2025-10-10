"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoaderOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/70 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-3 px-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

