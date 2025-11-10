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
    
    const { topicId } = await request.json();
    
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }
    
    // Get student record
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", (await admin.from("profiles").select("id").eq("auth_user_id", user.id).single()).data?.id)
      .single();
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // Check if already following
    const { data: existing } = await admin
      .from("topic_followers")
      .select("id")
      .eq("student_id", student.id)
      .eq("topic_id", topicId)
      .single();
    
    if (existing) {
      return NextResponse.json({ message: "Already following this topic" });
    }
    
    // Follow topic
    const { error } = await admin
      .from("topic_followers")
      .insert({
        student_id: student.id,
        topic_id: topicId
      });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Topic followed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to follow topic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");
    
    if (!topicId) {
      return NextResponse.json({ error: "Topic ID required" }, { status: 400 });
    }
    
    // Get student record
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", (await admin.from("profiles").select("id").eq("auth_user_id", user.id).single()).data?.id)
      .single();
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // Unfollow topic
    const { error } = await admin
      .from("topic_followers")
      .delete()
      .eq("student_id", student.id)
      .eq("topic_id", topicId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Topic unfollowed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to unfollow topic" }, { status: 500 });
  }
}
