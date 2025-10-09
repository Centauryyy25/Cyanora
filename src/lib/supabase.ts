import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Keep it non-throwing at import time for Next.js, but warn.
  console.warn("[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY env vars.");
}

export const supabaseServer = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: { persistSession: false },
});

export type Employee = {
  id: number;
  full_name: string | null;
  position: string | null;
  department: string | null;
  status: "ACTIVE" | "PROBATION" | "INACTIVE" | null;
  join_date?: string | null;
  avatar_url?: string | null;
};

