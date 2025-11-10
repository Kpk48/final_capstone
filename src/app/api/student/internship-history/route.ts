import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get student record
    const { data: student } = await supabase
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Fetch internship history
    const { data: history, error } = await supabase
      .from("internship_history")
      .select(`
        id,
        status,
        start_date,
        end_date,
        feedback,
        rating,
        certificate_url,
        internships!inner(
          title,
          description,
          location,
          stipend,
          companies!inner(name)
        )
      `)
      .eq("student_id", student.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Internship history fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ history: history || [] });
  } catch (err: any) {
    console.error("Internship history error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch history" }, { status: 500 });
  }
}
