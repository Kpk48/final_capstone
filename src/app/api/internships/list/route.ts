import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supa = getSupabaseAdmin();
  const server = await getSupabaseServer();
  
  // Get current user (if logged in)
  const { data: { user } } = await server.auth.getUser();
  let currentStudentId: string | null = null;
  
  if (user) {
    const { data: profile } = await supa
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (profile) {
      const { data: student } = await supa
        .from("students")
        .select("id")
        .eq("profile_id", profile.id)
        .single();
      
      if (student) {
        currentStudentId = student.id;
      }
    }
  }
  
  // Get internships with company info and topics
  const { data: internships, error } = await supa
    .from("internships")
    .select(`
      id,
      title,
      description,
      location,
      is_remote,
      stipend,
      openings,
      company:companies(
        id,
        name,
        profile_id,
        follower_count
      )
    `)
    .order("created_at", { ascending: false })
    .limit(50);
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Enrich with topics and follower info
  const enrichedInternships = await Promise.all(
    (internships || []).map(async (internship) => {
      // Get topics for this internship
      const { data: topicData } = await supa
        .from("internship_topics")
        .select(`
          relevance_score,
          topics!inner(
            id,
            name,
            slug,
            category
          )
        `)
        .eq("internship_id", internship.id)
        .order("relevance_score", { ascending: false })
        .limit(5);
      
      const topics = topicData?.map(t => {
        const topic = Array.isArray(t.topics) ? t.topics[0] : t.topics;
        return {
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
          category: topic.category,
          relevance_score: t.relevance_score
        };
      }) || [];
      
      // Handle company as potential array
      const company = Array.isArray(internship.company) ? internship.company[0] : internship.company;
      
      // Get follower count from company record or count manually
      let followerCount = company?.follower_count || 0;
      if (!company?.follower_count && company?.id) {
        const { count } = await supa
          .from("company_followers")
          .select("*", { count: "exact", head: true })
          .eq("company_id", company.id);
        followerCount = count || 0;
      }
      
      // Check if current user follows this company
      let isFollowing = false;
      if (currentStudentId && company?.id) {
        const { data: followData } = await supa
          .from("company_followers")
          .select("id")
          .eq("student_id", currentStudentId)
          .eq("company_id", company.id)
          .single();
        
        isFollowing = !!followData;
      }
      
      return {
        ...internship,
        topics,
        company: company ? {
          ...company,
          follower_count: followerCount,
          is_following: isFollowing
        } : null
      };
    })
  );
  
  return NextResponse.json(enrichedInternships);
}
