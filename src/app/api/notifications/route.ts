import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    
    const unreadOnly = req.nextUrl.searchParams.get("unread") === "true";
    
    let query = admin
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    
    if (unreadOnly) {
      query = query.eq("read", false);
    }
    
    const { data: notifications, error } = await query.limit(50);
    
    if (error) throw error;
    
    return NextResponse.json({
      notifications: notifications || [],
      count: notifications?.length || 0,
      unreadCount: notifications?.filter(n => !n.read).length || 0
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
