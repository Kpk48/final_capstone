import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get("role"); // Optional: filter by role
    const search = searchParams.get("search"); // Optional: search by name/email

    // Get current user's profile
    const { data: currentProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!currentProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Build query for other users
    let query = admin
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        email,
        role
      `)
      .neq("id", currentProfile.id) // Exclude current user
      .order("display_name");

    // Apply role filter if provided
    if (roleFilter && ["student", "company", "admin"].includes(roleFilter)) {
      query = query.eq("role", roleFilter);
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      const safe = search.trim();
      query = query.or(`display_name.ilike.%${safe}%,email.ilike.%${safe}%,username.ilike.%${safe}%`);
    }

    const { data: users, error } = await query.limit(50);

    if (error) {
      console.error("Users fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich with role-specific details
    const enrichedUsers = await Promise.all(
      (users || []).map(async (userProfile) => {
        let additionalInfo: any = {};

        if (userProfile.role === "student") {
          const { data: student } = await admin
            .from("students")
            .select("university, degree")
            .eq("profile_id", userProfile.id)
            .single();
          additionalInfo = student || {};
        } else if (userProfile.role === "company") {
          const { data: company } = await admin
            .from("companies")
            .select("name, website")
            .eq("profile_id", userProfile.id)
            .single();
          additionalInfo = company || {};
        }

        return {
          profile_id: userProfile.id,
          username: userProfile.username,
          name: userProfile.display_name || "Anonymous",
          email: userProfile.email,
          role: userProfile.role,
          ...additionalInfo
        };
      })
    );

    return NextResponse.json({ users: enrichedUsers });
  } catch (err: any) {
    console.error("Users fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}
