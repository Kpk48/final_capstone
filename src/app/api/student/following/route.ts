import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    // Get student record
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .single();
    
    if (!student) {
      return NextResponse.json({ 
        topics: [],
        companies: []
      });
    }
    
    // Get followed topics
    const { data: followedTopics } = await admin
      .from("topic_followers")
      .select(`
        topic_id,
        created_at,
        topics!inner(
          id,
          name,
          slug,
          category,
          description,
          follower_count
        )
      `)
      .eq("student_id", student.id);
    
    // Get followed companies
    const { data: followedCompanies } = await admin
      .from("company_followers")
      .select(`
        company_id,
        created_at,
        companies!inner(
          id,
          name,
          website,
          logo_url,
          description,
          follower_count,
          profile_id,
          profiles!inner(
            username
          ),
          internships(
            id,
            title,
            location,
            is_remote,
            stipend,
            openings,
            created_at
          )
        )
      `)
      .eq("student_id", student.id);
    
    // Format response
    const topics = followedTopics?.map(f => ({
      ...f.topics,
      followed_at: f.created_at
    })) || [];
    
    const companies = followedCompanies?.map(f => {
      const companyData: any = Array.isArray(f.companies) ? f.companies[0] : f.companies;
      if (!companyData) {
        return null;
      }

      const profile = companyData.profiles;
      const internships = companyData.internships || [];

      const company = {
        id: companyData.id,
        name: companyData.name,
        website: companyData.website,
        logo_url: companyData.logo_url,
        description: companyData.description,
        follower_count: companyData.follower_count || 0,
        username: profile?.username || null,
        internships: internships.map((internship: any) => ({
          id: internship.id,
          title: internship.title,
          location: internship.location,
          is_remote: internship.is_remote,
          stipend: internship.stipend,
          openings: internship.openings,
          created_at: internship.created_at
        })),
        followed_at: f.created_at
      };

      return company;
    }).filter(Boolean) || [];
    
    return NextResponse.json({ topics, companies });
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || "Failed to fetch following data" 
    }, { status: 500 });
  }
}
