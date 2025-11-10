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
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    
    const supa = getSupabaseAdmin();
    
    // Fetch all companies with profile details and internship count
    const { data: companies, error } = await supa
      .from("companies")
      .select(`
        id,
        name,
        profile_id,
        created_at,
        profiles!inner(email, display_name),
        internships(count)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the data to include internship count
    const formattedCompanies = companies?.map(comp => ({
      id: comp.id,
      name: comp.name,
      profile_id: comp.profile_id,
      created_at: comp.created_at,
      profiles: comp.profiles,
      _count: {
        internships: comp.internships?.[0]?.count || 0
      }
    })) || [];
    
    return NextResponse.json({ companies: formattedCompanies });
  } catch (err: any) {
    console.error("Fetch companies error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch companies" }, { status: 500 });
  }
}
