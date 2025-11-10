import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: "Missing conversation_id" }, { status: 400 });
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

    // Mark messages as read (only messages sent by the other person)
    const { error } = await admin
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", conversation_id)
      .neq("sender_profile_id", profile.id)  // Not sent by current user
      .eq("is_read", false);                  // Currently unread

    if (error) {
      console.error("Mark read error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Mark read error:", err);
    return NextResponse.json({ error: err.message || "Failed to mark messages as read" }, { status: 500 });
  }
}
