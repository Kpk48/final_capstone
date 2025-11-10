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
    const { application_id, content } = body;

    if (!application_id || !content || !content.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Determine sender type and ID
    let senderId: string;
    let senderType: "student" | "company";

    if (profile.role === "student") {
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!student) {
        return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
      }

      // Verify this student owns the application
      const { data: application } = await supabase
        .from("applications")
        .select("id")
        .eq("id", application_id)
        .eq("student_id", student.id)
        .single();

      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      senderId = student.id;
      senderType = "student";
    } else {
      // Company role
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!company) {
        return NextResponse.json({ error: "Company profile not found" }, { status: 404 });
      }

      // Verify this company owns the internship for this application
      const { data: application } = await supabase
        .from("applications")
        .select(`
          id,
          internships!inner(company_id)
        `)
        .eq("id", application_id)
        .single();

      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      const internship = Array.isArray(application.internships) 
        ? application.internships[0] 
        : application.internships;

      if (internship?.company_id !== company.id) {
        return NextResponse.json({ error: "Unauthorized access to this application" }, { status: 403 });
      }

      senderId = company.id;
      senderType = "company";
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        application_id,
        sender_id: senderId,
        sender_type: senderType,
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Message insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message });
  } catch (err: any) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
