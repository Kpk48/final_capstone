import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { embedText } from "@/lib/embeddings";
import { analyzeInternshipTopics } from "@/lib/aiTopicAnalysis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, location, is_remote = true, stipend, openings = 1 } = body;
    if (!title || !description) return NextResponse.json({ error: "title and description required" }, { status: 400 });

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    // get company id for current user
    const { data: u } = await server.auth.getUser();
    const user = u.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { data: profile } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 400 });
    const { data: company } = await admin.from("companies").select("id").eq("profile_id", profile.id).maybeSingle();
    if (!company) return NextResponse.json({ error: "company not found" }, { status: 400 });

    const { data: inserted, error } = await admin
      .from("internships")
      .insert({ company_id: company.id, title, description, location, is_remote, stipend, openings })
      .select("id")
      .single();
    if (error) throw error;

    // embed description for matching
    const vectors = await embedText([description]);
    await admin.from("embeddings").insert({ owner_type: "internship", owner_id: inserted.id, content: description, embedding: vectors[0] });

    // AI-powered topic analysis and pub-sub notifications
    try {
      console.log('🤖 Analyzing internship topics with AI...');
      const topicMatches = await analyzeInternshipTopics(title, description, body.requirements);
      
      if (topicMatches.length > 0) {
        console.log(`📊 Found ${topicMatches.length} relevant topics`);
        
        // Create topics dynamically if they don't exist
        const topicIds: { id: string; name: string; relevanceScore: number }[] = [];
        
        for (const match of topicMatches) {
          // Check if topic exists
          const { data: existingTopic } = await admin
            .from("topics")
            .select("id, name")
            .ilike("name", match.topic)
            .single();
          
          if (existingTopic) {
            // Use existing topic
            topicIds.push({
              id: existingTopic.id,
              name: existingTopic.name,
              relevanceScore: match.relevanceScore
            });
          } else {
            // Create new topic dynamically
            const slug = match.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const { data: newTopic } = await admin
              .from("topics")
              .insert({
                name: match.topic,
                slug: slug,
                category: match.category,
                description: `Auto-generated: ${match.reason}`,
                follower_count: 0
              })
              .select("id, name")
              .single();
            
            if (newTopic) {
              console.log(`✨ Created new topic: ${match.topic}`);
              topicIds.push({
                id: newTopic.id,
                name: newTopic.name,
                relevanceScore: match.relevanceScore
              });
            }
          }
        }
        
        if (topicIds.length > 0) {
          // Store topic associations
          const topicAssociations = topicIds.map(topic => ({
            internship_id: inserted.id,
            topic_id: topic.id,
            relevance_score: topic.relevanceScore
          }));
          
          await admin.from("internship_topics").insert(topicAssociations);
          
          // Notify followers of each topic (Pub-Sub pattern)
          for (const topic of topicIds) {
            try {
              await admin.rpc('notify_topic_followers_new_internship', {
                p_internship_id: inserted.id,
                p_topic_id: topic.id,
                p_relevance_score: topic.relevanceScore
              });
              console.log(`📢 Notified ${topic.name} followers`);
            } catch (notifyError) {
              console.log(`⚠️  Notification for ${topic.name} skipped (no followers or error)`);
            }
          }
        }
      }
    } catch (aiError) {
      // Don't fail the whole request if AI analysis fails
      console.error('AI topic analysis failed:', aiError);
    }

    return NextResponse.json({ 
      id: inserted.id,
      message: "Internship posted successfully! Relevant followers will be notified."
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
