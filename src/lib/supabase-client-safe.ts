"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";

// Returns a guaranteed Supabase browser client for client components.
// Throws with clear messages if used on the server or env is missing.
export function getSupabaseSafe() {
  if (typeof window === "undefined") {
    throw new Error("getSupabaseSafe() can only be used in client components.");
  }
  if (!supabaseBrowser) {
    throw new Error("Supabase credentials are missing or client not initialized.");
  }
  return supabaseBrowser;
}

