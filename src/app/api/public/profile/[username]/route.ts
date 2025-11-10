import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Get public profile by username
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Get profile by username
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const isVisible = profile.role === "company" || profile.is_public;

    const result: any = {
      username: profile.username,
      display_name: profile.display_name,
      role: profile.role,
      is_public: profile.is_public,
      created_at: profile.created_at,
    };

    if (profile.role === "student") {
      const { data: student } = await admin
        .from("students")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (!isVisible) {
        // Private profile - limited info
        result.private = true;
        result.student = {
          private: true,
          message: "This profile is private",
        };
      } else if (student) {
        // Public profile - full details
        result.student = {
          university: student.university,
          degree: student.degree,
          graduation_year: student.graduation_year,
          bio: student.bio,
          resume_url: student.resume_url,
          resume_text: student.resume_text,
        };
      }
    } else if (profile.role === "company") {
      // Companies are always public
      const { data: company } = await admin
        .from("companies")
        .select("*")
        .eq("profile_id", profile.id)
        .maybeSingle();

      if (company) {
        result.company = {
          name: company.name,
          website: company.website,
          description: company.description,
          logo_url: company.logo_url,
        };

        // Get company's posted internships
        const { data: internships } = await admin
          .from("internships")
          .select(`
            id,
            title,
            description,
            location,
            stipend,
            duration,
            openings,
            requirements,
            responsibilities,
            skills,
            created_at
          `)
          .eq("company_id", company.id)
          .order("created_at", { ascending: false });

        result.internships = internships || [];
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
