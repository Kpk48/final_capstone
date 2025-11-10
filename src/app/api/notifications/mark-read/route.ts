import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await req.json();
    const { notification_id } = body;
    
    if (!notification_id) {
      return NextResponse.json({ error: "notification_id required" }, { status: 400 });
    }
    
    // Get user's profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Mark notification as read (only if it belongs to this user)
    const { error } = await admin
      .from("notifications")
      .update({ read: true })
      .eq("id", notification_id)
      .eq("user_id", profile.id);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
