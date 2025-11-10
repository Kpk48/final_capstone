import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { decryptMessage } from "@/lib/encryption";

export async function GET() {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's profile
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, display_name")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all conversations where user is a participant
    const { data: conversations, error } = await admin
      .from("conversations")
      .select(`
        id,
        participant1_profile_id,
        participant2_profile_id,
        application_id,
        last_message_at,
        created_at
      `)
      .or(`participant1_profile_id.eq.${profile.id},participant2_profile_id.eq.${profile.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Conversations fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich conversations with participant details and messages
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        // Determine the other participant
        const otherParticipantId = 
          conv.participant1_profile_id === profile.id
            ? conv.participant2_profile_id
            : conv.participant1_profile_id;

        // Get other participant's details
        const { data: otherProfile } = await admin
          .from("profiles")
          .select("id, display_name, role, email")
          .eq("id", otherParticipantId)
          .single();

        // Get messages for this conversation
        const { data: messages } = await admin
          .from("messages")
          .select("*")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });

        // Decrypt message contents
        const decryptedMessages = messages?.map(msg => {
          try {
            return {
              ...msg,
              content: decryptMessage(msg.content)
            };
          } catch (error) {
            console.error("Failed to decrypt message:", msg.id);
            return {
              ...msg,
              content: "[Encrypted message - decryption failed]"
            };
          }
        }) || [];

        // Count unread messages (from other participant)
        const unreadCount = decryptedMessages?.filter(
          m => m.sender_profile_id !== profile.id && !m.is_read
        ).length || 0;

        // Get application details if linked
        let applicationDetails = null;
        if (conv.application_id) {
          const { data: application } = await admin
            .from("applications")
            .select(`
              id,
              status,
              internships!inner(title)
            `)
            .eq("id", conv.application_id)
            .single();

          if (application) {
            const internship = Array.isArray(application.internships) 
              ? application.internships[0] 
              : application.internships;
            
            applicationDetails = {
              id: application.id,
              status: application.status,
              internship_title: internship?.title || "Unknown"
            };
          }
        }

        return {
          conversation_id: conv.id,
          other_user: {
            profile_id: otherProfile?.id,
            name: otherProfile?.display_name || "Anonymous",
            role: otherProfile?.role,
            email: otherProfile?.email
          },
          application: applicationDetails,
          last_message_at: conv.last_message_at,
          unread_count: unreadCount,
          messages: decryptedMessages
        };
      })
    );

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (err: any) {
    console.error("Conversations error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch conversations" }, { status: 500 });
  }
}
