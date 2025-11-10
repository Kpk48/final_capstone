import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and role
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let conversations: any[] = [];

    if (profile.role === "student") {
      // Get student ID
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!student) {
        return NextResponse.json({ conversations: [] });
      }

      // Get applications with messages
      const { data: applications } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          internships!inner(
            title,
            companies!inner(
              name
            )
          )
        `)
        .eq("student_id", student.id);

      if (applications) {
        for (const app of applications) {
          // Get messages for this application
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("application_id", app.id)
            .order("created_at", { ascending: true });

          // Count unread messages
          const unreadCount = messages?.filter(
            m => m.sender_type === "company" && !m.is_read
          ).length || 0;

          const lastMessage = messages?.[messages.length - 1];

          const internship = Array.isArray(app.internships) ? app.internships[0] : app.internships;
          const company = Array.isArray(internship?.companies) ? internship.companies[0] : internship?.companies;

          conversations.push({
            application_id: app.id,
            internship_title: internship?.title || "Unknown",
            company_name: company?.name || "Unknown",
            application_status: app.status,
            last_message_at: lastMessage?.created_at || new Date().toISOString(),
            unread_count: unreadCount,
            messages: messages || [],
          });
        }
      }
    } else if (profile.role === "company") {
      // Get company ID
      const { data: company } = await supabase
        .from("companies")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!company) {
        return NextResponse.json({ conversations: [] });
      }

      // Get internships for this company
      const { data: internships } = await supabase
        .from("internships")
        .select("id")
        .eq("company_id", company.id);

      if (internships) {
        const internshipIds = internships.map(i => i.id);

        // Get applications for these internships
        const { data: applications } = await supabase
          .from("applications")
          .select(`
            id,
            status,
            internships!inner(title),
            students!inner(
              profiles!inner(display_name, email)
            )
          `)
          .in("internship_id", internshipIds);

        if (applications) {
          for (const app of applications) {
            // Get messages for this application
            const { data: messages } = await supabase
              .from("messages")
              .select("*")
              .eq("application_id", app.id)
              .order("created_at", { ascending: true });

            // Count unread messages
            const unreadCount = messages?.filter(
              m => m.sender_type === "student" && !m.is_read
            ).length || 0;

            const lastMessage = messages?.[messages.length - 1];

            const internship = Array.isArray(app.internships) ? app.internships[0] : app.internships;
            const student = Array.isArray(app.students) ? app.students[0] : app.students;
            const studentProfile = Array.isArray(student?.profiles) ? student.profiles[0] : student?.profiles;

            conversations.push({
              application_id: app.id,
              internship_title: internship?.title || "Unknown",
              student_name: studentProfile?.display_name || "Anonymous",
              student_email: studentProfile?.email || "",
              application_status: app.status,
              last_message_at: lastMessage?.created_at || new Date().toISOString(),
              unread_count: unreadCount,
              messages: messages || [],
            });
          }
        }
      }
    }

    // Sort by last message time
    conversations.sort((a, b) => 
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    return NextResponse.json({ conversations });
  } catch (err: any) {
    console.error("Conversations error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
