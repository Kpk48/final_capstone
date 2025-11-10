import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST() {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if profile exists
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (existingProfile) {
      // Profile exists, check if student/company record exists
      const role = existingProfile.role;

      if (role === "student") {
        const { data: student } = await admin
          .from("students")
          .select("id")
          .eq("profile_id", existingProfile.id)
          .maybeSingle();

        if (!student) {
          // Create missing student record
          await admin.from("students").insert({ profile_id: existingProfile.id });
          console.log("Created missing student record for profile:", existingProfile.id);
        }
      } else if (role === "company") {
        const { data: company } = await admin
          .from("companies")
          .select("id")
          .eq("profile_id", existingProfile.id)
          .maybeSingle();

        if (!company) {
          // Create missing company record
          const displayName = user.user_metadata?.display_name || "Unnamed Company";
          await admin.from("companies").insert({ 
            profile_id: existingProfile.id,
            name: displayName 
          });
          console.log("Created missing company record for profile:", existingProfile.id);
        }
      }

      return NextResponse.json({ 
        ok: true, 
        profile_id: existingProfile.id,
        role 
      });
    }

    // Create new profile if it doesn't exist
    const role = user.user_metadata?.role || "student";
    const displayName = user.user_metadata?.display_name || "";

    const { data: newProfile, error: profileError } = await admin
      .from("profiles")
      .insert({
        auth_user_id: user.id,
        email: user.email,
        display_name: displayName,
        role: role,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create role-specific record
    if (role === "student") {
      const { error: studentError } = await admin
        .from("students")
        .insert({ profile_id: newProfile.id });

      if (studentError) {
        console.error("Student creation error:", studentError);
        return NextResponse.json({ error: studentError.message }, { status: 500 });
      }
    } else if (role === "company") {
      const { error: companyError } = await admin
        .from("companies")
        .insert({ 
          profile_id: newProfile.id,
          name: displayName || "Unnamed Company"
        });

      if (companyError) {
        console.error("Company creation error:", companyError);
        return NextResponse.json({ error: companyError.message }, { status: 500 });
      }
    }

    console.log("Created new profile and role record:", { profile_id: newProfile.id, role });

    return NextResponse.json({ 
      ok: true, 
      profile_id: newProfile.id,
      role,
      created: true
    });
  } catch (err: any) {
    console.error("Setup profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to setup profile" }, { status: 500 });
  }
}
