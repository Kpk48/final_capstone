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
    
    // Fetch all internships with company name and application count
    const { data: internships, error } = await supa
      .from("internships")
      .select(`
        id,
        title,
        location,
        stipend,
        created_at,
        companies!inner(name),
        applications(count)
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Format the data to include application count
    const formattedInternships = internships?.map(int => ({
      id: int.id,
      title: int.title,
      location: int.location,
      stipend: int.stipend,
      created_at: int.created_at,
      companies: int.companies,
      _count: {
        applications: int.applications?.[0]?.count || 0
      }
    })) || [];
    
    return NextResponse.json({ internships: formattedInternships });
  } catch (err: any) {
    console.error("Fetch internships error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch internships" }, { status: 500 });
  }
}
