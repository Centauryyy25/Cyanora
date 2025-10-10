import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

// =========================================================
// 🔧 SUPABASE CLIENT SETUP
// =========================================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// =========================================================
// ⚙️ ALLOWED STATUS FILTER (for employment_status only)
// =========================================================
const ALLOWED_STATUS = new Set(["ACTIVE", "PROBATION", "INACTIVE"]);

// =========================================================
// 🚀 GET /api/employees
// =========================================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const schema = z.object({
      status: z
        .string()
        .optional()
        .transform((v) => (v ? v.toUpperCase() : v)),
      q: z.string().trim().default(""),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      offset: z.coerce.number().int().min(0).default(0),
    });
    const parsed = schema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
    }
    const { status, q, limit, offset } = parsed.data as any;

    // --- 🧱 Validation ---
    if (status && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed: ${Array.from(ALLOWED_STATUS).join(", ")}` },
        { status: 400 },
      );
    }

    // =========================================================
    // 🧩 MAIN QUERY — fetch all employees with joins
    // =========================================================
    const select = `
      id,
      full_name,
      email,
      phone_number,
      employment_status,
      join_date,
      photo_url,
      departments (
        id,
        name
      ),
      positions (
        id,
        title
      ),
      users (
        id,
        username,
        email,
        roles (
          id,
          name
        )
      )
    `;

    // Base query
    let query = supabase
      .from("employees")
      .select(select, { count: "exact" })
      .order("full_name", { ascending: true })
      .range(offset, Math.max(offset, offset + limit - 1));

    // =========================================================
    // 🧭 FILTERING (use employment_status, not status)
    // =========================================================
    if (status) query = query.eq("employment_status", status);

    // optional search
    if (q) query = query.ilike("full_name", `%${q}%`);

    // =========================================================
    // 🧠 EXECUTE QUERY
    // =========================================================
    const { data, error, count } = await query;

    if (error) {
      console.error("/api/employees: Supabase query error:", {
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
        code: (error as any).code,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // =========================================================
    // 🧾 FLATTEN RESULT — prepare for frontend consumption
    // =========================================================
    const flat = (data ?? []).map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      position: row.positions?.title ?? null,
      department: row.departments?.name ?? null,
      status: row.employment_status ?? null,
      join_date: row.join_date ?? null,
      avatar_url: row.photo_url ?? null,
    }));

    // =========================================================
    // ✅ SUCCESS RESPONSE
    // =========================================================
    const res = NextResponse.json(
      { data: flat, paging: { limit, offset, count: count ?? undefined } },
      { status: 200 },
    );
    // Light caching for repeated queries (tune for your env)
    res.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=120");
    return res;
  } catch (err: any) {
    console.error("/api/employees: Unexpected error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
