import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  const { data: u } = await server.auth.getUser();
  const user = u.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: profile, error: pErr } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (pErr || !profile) return NextResponse.json({ error: pErr?.message || "profile not found" }, { status: 400 });

  const { data: company, error: cErr } = await admin.from("companies").select("id, name").eq("profile_id", profile.id).maybeSingle();
  if (cErr || !company) return NextResponse.json({ error: cErr?.message || "company not found" }, { status: 400 });

  const { data, error } = await admin
    .from("internships")
    .select("id, title, description, created_at, openings")
    .eq("company_id", company.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ company, internships: data ?? [] });
}
