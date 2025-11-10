import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { encryptMessage } from "@/lib/encryption";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipient_profile_id, content, application_id } = body;

    if (!recipient_profile_id || !content || !content.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Encrypt the message content
    const encryptedContent = encryptMessage(content.trim());

    // Get sender's profile
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!senderProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify recipient exists
    const { data: recipientProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("id", recipient_profile_id)
      .single();

    if (!recipientProfile) {
      return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
    }

    // Get or create conversation using database function
    const { data: conversationData, error: convError } = await admin.rpc(
      'get_or_create_conversation',
      {
        p_user1_profile_id: senderProfile.id,
        p_user2_profile_id: recipient_profile_id,
        p_application_id: application_id || null
      }
    );

    if (convError) {
      console.error("Conversation creation error:", convError);
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    const conversation_id = conversationData;

    // Insert the encrypted message
    const { data: message, error: messageError } = await admin
      .from("messages")
      .insert({
        conversation_id,
        sender_profile_id: senderProfile.id,
        content: encryptedContent,
        is_read: false
      })
      .select()
      .single();

    if (messageError) {
      console.error("Message insert error:", messageError);
      return NextResponse.json({ error: messageError.message }, { status: 500 });
    }

    return NextResponse.json({ message, conversation_id });
  } catch (err: any) {
    console.error("Send message error:", err);
    return NextResponse.json({ error: err.message || "Failed to send message" }, { status: 500 });
  }
}
