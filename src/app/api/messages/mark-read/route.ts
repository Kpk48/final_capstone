import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { application_id } = body;

    if (!application_id) {
      return NextResponse.json({ error: "Missing application_id" }, { status: 400 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || (profile.role !== "student" && profile.role !== "company")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark messages as read based on user role
    // Students mark company messages as read, companies mark student messages as read
    const senderTypeToMark = profile.role === "student" ? "company" : "student";

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("application_id", application_id)
      .eq("sender_type", senderTypeToMark)
      .eq("is_read", false);

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
