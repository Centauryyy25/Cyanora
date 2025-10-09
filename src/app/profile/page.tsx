import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAppJWT } from "@/lib/jwt";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("app_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let employeeId: number | null = null;
  let userId: number | null = null;
  try {
    const payload = await verifyAppJWT(token!);
    const emp = (payload as any).employee as { id?: number | null } | null;
    employeeId = emp?.id ?? null;
    userId = payload?.sub ? Number(payload.sub) : null;
  } catch {
    redirect("/login");
  }

  if (!employeeId && userId && supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    employeeId = (data as any)?.id ?? null;
  }

  if (employeeId) {
    redirect(`/profile/${employeeId}`);
  }

  redirect("/dashboard");
}

