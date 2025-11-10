import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET student profile with all details
export async function GET() {
  try {
    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: student } = await admin
      .from("students")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    return NextResponse.json({
      profile,
      student: student || null,
    });
  } catch (error: any) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PUT update student profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { display_name, is_public, password, university, degree, graduation_year, bio, resume_text, resume_url, username } = body;

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If changing visibility, require password verification with the signed-in client
    if (is_public !== undefined) {
      if (!password || !user.email) {
        return NextResponse.json({ error: "Password required to change visibility" }, { status: 400 });
      }

      const { error: verifyError } = await server.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (verifyError) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }
    }

    // Update profile
    const profileUpdates: any = {};
    if (display_name !== undefined) profileUpdates.display_name = display_name;
    if (is_public !== undefined) profileUpdates.is_public = is_public;

    if (Object.keys(profileUpdates).length > 0) {
      await admin
        .from("profiles")
        .update(profileUpdates)
        .eq("auth_user_id", user.id);
    }

    // Get profile to get student record
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (profile) {
      const { data: existingStudent } = await admin
        .from("students")
        .select("id")
        .eq("profile_id", profile.id)
        .maybeSingle();

      const studentUpdates: any = {};
      if (university !== undefined) studentUpdates.university = university === "" ? null : university;
      if (degree !== undefined) studentUpdates.degree = degree === "" ? null : degree;
      if (graduation_year !== undefined) studentUpdates.graduation_year = graduation_year === "" || graduation_year === null ? null : graduation_year;
      if (bio !== undefined) studentUpdates.bio = bio === "" ? null : bio;
      if (resume_text !== undefined) studentUpdates.resume_text = resume_text === "" ? null : resume_text;
      if (resume_url !== undefined) studentUpdates.resume_url = resume_url === "" ? null : resume_url;

      if (Object.keys(studentUpdates).length > 0) {
        if (existingStudent) {
          // Update existing student
          const { error: updateError } = await admin
            .from("students")
            .update(studentUpdates)
            .eq("id", existingStudent.id);
          
          if (updateError) {
            console.error("Student update error:", updateError);
            throw new Error(`Failed to update student: ${updateError.message}`);
          }
        } else {
          // Create new student record
          const { error: insertError } = await admin
            .from("students")
            .insert({
              profile_id: profile.id,
              ...studentUpdates,
            });
          
          if (insertError) {
            console.error("Student insert error:", insertError);
            throw new Error(`Failed to create student: ${insertError.message}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE student profile
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body;

    const server = await getSupabaseServer();

    const { data: { user } } = await server.auth.getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify password
    const admin = getSupabaseAdmin();

    const { error: verifyError } = await admin.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (verifyError) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    // Delete profile (cascades to student via foreign keys)
    const { error: profileDeleteError } = await admin
      .from("profiles")
      .delete()
      .eq("auth_user_id", user.id);

    if (profileDeleteError) {
      throw new Error(profileDeleteError.message);
    }

    // Delete the user account
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE profile error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
