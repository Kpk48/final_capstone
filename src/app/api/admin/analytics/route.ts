import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAdmin() {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  const { data: u } = await server.auth.getUser();
  const user = u.user;
  if (!user) return false;
  const { data: profile } = await admin.from("profiles").select("role").eq("auth_user_id", user.id).maybeSingle();
  return profile?.role === "admin";
}

export async function GET() {
  const isAdmin = await requireAdmin();
  if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  
  const supa = getSupabaseAdmin();
  
  // Count total users (profiles)
  const { count: total_users, error: userError } = await supa
    .from("profiles")
    .select("*", { count: "exact", head: true });
  
  // Count total internships
  const { count: total_internships, error: internshipError } = await supa
    .from("internships")
    .select("*", { count: "exact", head: true });
  
  // Count total applications
  const { count: total_applications, error: appError } = await supa
    .from("applications")
    .select("*", { count: "exact", head: true });
  
  if (userError || internshipError || appError) {
    return NextResponse.json({ 
      error: userError?.message || internshipError?.message || appError?.message 
    }, { status: 500 });
  }
  
  return NextResponse.json({
    total_users: total_users || 0,
    total_internships: total_internships || 0,
    total_applications: total_applications || 0,
  });
}
