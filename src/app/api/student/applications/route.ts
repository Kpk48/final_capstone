import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    // Get current user
    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get profile
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Get student
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    // Get applications with internship and company details
    const { data: applications, error } = await admin
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        cover_letter,
        internships!inner(
          id,
          title,
          description,
          location,
          is_remote,
          stipend,
          openings,
          created_at,
          companies!inner(
            id,
            name,
            logo_url,
            profile_id
          )
        )
      `)
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(applications || []);
  } catch (error: any) {
    console.error('Error fetching student applications:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
