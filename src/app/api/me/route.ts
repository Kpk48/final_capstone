import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const s = await getSupabaseServer();
  const { data: u } = await s.auth.getUser();
  const user = u.user;
  if (!user) return NextResponse.json({ user: null });
  const { data: profile } = await s.from("profiles").select("id, role, display_name, auth_user_id").eq("auth_user_id", user.id).maybeSingle();
  let student_id: string | null = null;
  let company_id: string | null = null;
  if (profile) {
    const { data: st } = await s.from("students").select("id").eq("profile_id", profile.id).maybeSingle();
    const { data: co } = await s.from("companies").select("id").eq("profile_id", profile.id).maybeSingle();
    student_id = st?.id ?? null;
    company_id = co?.id ?? null;
  }
  return NextResponse.json({ user: { id: user.id, email: user.email }, profile, student_id, company_id });
}
