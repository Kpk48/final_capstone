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
  
  // Fetch all profiles with student/company data
  const { data: profiles, error } = await supa
    .from("profiles")
    .select(`
      id,
      email,
      display_name,
      role,
      created_at,
      students(id, university, degree, graduation_year, bio),
      companies(id, name, website, description)
    `)
    .order("created_at", { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Format the response to include role-specific data
  const users = profiles?.map(profile => {
    const student = Array.isArray(profile.students) ? profile.students[0] : profile.students;
    const company = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies;
    
    return {
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role,
      created_at: profile.created_at,
      student_data: student || null,
      company_data: company || null
    };
  });
  
  return NextResponse.json({ users: users || [] });
}
