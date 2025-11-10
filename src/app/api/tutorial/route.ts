import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET - Check if tutorial is completed
export async function GET(req: NextRequest) {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile to get user ID
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if preferences exist
    const { data: preferences } = await admin
      .from("user_preferences")
      .select("tutorial_completed")
      .eq("user_id", profile.id)
      .maybeSingle();

    // If no preferences exist, create with tutorial_completed = false
    if (!preferences) {
      await admin
        .from("user_preferences")
        .insert({
          user_id: profile.id,
          tutorial_completed: false
        });

      return NextResponse.json({ tutorial_completed: false });
    }

    return NextResponse.json({ 
      tutorial_completed: preferences.tutorial_completed ?? false 
    });

  } catch (error: any) {
    console.error("Tutorial status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Mark tutorial as completed
export async function POST(req: NextRequest) {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
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

    // Update or insert preferences
    const { error } = await admin
      .from("user_preferences")
      .upsert({
        user_id: profile.id,
        tutorial_completed: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return NextResponse.json({ success: true, tutorial_completed: true });

  } catch (error: any) {
    console.error("Tutorial completion error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
