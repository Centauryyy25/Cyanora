"use client";

import { createClient } from "@supabase/supabase-js";

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) as string | undefined;
const anon = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) as string | undefined;

export const supabaseBrowser = url && anon
  ? createClient(url, anon)
  : null;
