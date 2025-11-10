import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Search for users and companies
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, student, company

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ 
        error: "Query must be at least 2 characters" 
      }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const searchTerm = query.trim();

    // Build base query
    let profileQuery = admin
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        role,
        is_public,
        email,
        created_at
      `);

    // Filter by type
    if (type === "student") {
      profileQuery = profileQuery.eq("role", "student");
    } else if (type === "company") {
      profileQuery = profileQuery.eq("role", "company");
    }

    // Search by username or display_name (case-insensitive)
    profileQuery = profileQuery.or(
      `username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`
    );

    // Limit results
    profileQuery = profileQuery.limit(20);

    const { data: profiles, error } = await profileQuery;

    if (error) throw error;

    // Get additional details for each profile
    const results = await Promise.all(
      profiles.map(async (profile) => {
        const baseResult: any = {
          id: profile.id,
          profile_id: profile.id,  // For MessageButton compatibility
          username: profile.username,
          display_name: profile.display_name,
          role: profile.role,
          is_public: profile.is_public,
        };

        // Companies are always public
        const isVisible = profile.role === "company" || profile.is_public;

        if (profile.role === "student") {
          // Fetch student details
          const { data: student } = await admin
            .from("students")
            .select("university, degree, graduation_year, bio, resume_url")
            .eq("profile_id", profile.id)
            .maybeSingle();

          if (isVisible && student) {
            // Public profile - show all details
            baseResult.student = {
              university: student.university,
              degree: student.degree,
              graduation_year: student.graduation_year,
              bio: student.bio,
              resume_url: student.resume_url,
            };
          } else if (!isVisible) {
            // Private profile - show limited info
            baseResult.student = {
              private: true,
            };
          }
        } else if (profile.role === "company") {
          // Fetch company details (always public)
          const { data: company } = await admin
            .from("companies")
            .select("id, name, website, description, logo_url, follower_count")
            .eq("profile_id", profile.id)
            .maybeSingle();

          if (company) {
            baseResult.company = {
              id: company.id,
              name: company.name,
              website: company.website,
              description: company.description,
              logo_url: company.logo_url,
              follower_count: company.follower_count || 0,
            };
          }
        }

        return baseResult;
      })
    );

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
