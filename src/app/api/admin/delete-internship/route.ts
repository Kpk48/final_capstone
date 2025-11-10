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

export async function DELETE(req: Request) {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    
    const { internshipId } = await req.json();
    if (!internshipId) {
      return NextResponse.json({ error: "internshipId required" }, { status: 400 });
    }
    
    const admin = getSupabaseAdmin();
    
    // Delete internship (cascades to applications due to foreign keys)
    const { error } = await admin
      .from("internships")
      .delete()
      .eq("id", internshipId);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete internship error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete internship" }, { status: 500 });
  }
}
