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
    
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    
    const admin = getSupabaseAdmin();
    
    // Get the profile to find auth_user_id
    const { data: profile } = await admin
      .from("profiles")
      .select("auth_user_id, role")
      .eq("id", userId)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Don't allow deleting other admins
    if (profile.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin users" }, { status: 403 });
    }
    
    // Delete profile (cascades to students/companies due to foreign keys)
    const { error: profileError } = await admin
      .from("profiles")
      .delete()
      .eq("id", userId);
    
    if (profileError) throw profileError;
    
    // Delete auth user
    const { error: authError } = await admin.auth.admin.deleteUser(profile.auth_user_id);
    
    if (authError) {
      console.error("Failed to delete auth user:", authError);
      // Profile is deleted, but auth user remains - acceptable
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
