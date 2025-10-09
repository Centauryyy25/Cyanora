import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

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
    const rawStatus = searchParams.get("status");
    const status = rawStatus ? rawStatus.toUpperCase() : null;
    const q = (searchParams.get("q") || "").trim();

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
      .select(select)
      .order("full_name", { ascending: true });

    // =========================================================
    // 🧭 FILTERING (use employment_status, not status)
    // =========================================================
    if (status) query = query.eq("employment_status", status);

    // optional search
    if (q) query = query.ilike("full_name", `%${q}%`);

    // =========================================================
    // 🧠 EXECUTE QUERY
    // =========================================================
    const { data, error } = await query;

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
      email: row.email,
      phone_number: row.phone_number,
      employment_status: row.employment_status,
      join_date: row.join_date,
      photo_url: row.photo_url,
      department: row.departments?.name ?? null,
      position: row.positions?.title ?? null,
      role: row.users?.roles?.name ?? null,
    }));

    // =========================================================
    // ✅ SUCCESS RESPONSE
    // =========================================================
    return NextResponse.json({ data: flat }, { status: 200 });
  } catch (err: any) {
    console.error("/api/employees: Unexpected error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Unexpected error" },
      { status: 500 },
    );
  }
}
