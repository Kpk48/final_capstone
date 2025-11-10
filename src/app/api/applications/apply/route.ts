import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { internship_id, cover_letter } = await req.json();
    
    if (!internship_id) {
      console.error("Apply error: Missing internship_id");
      return NextResponse.json({ error: "internship_id required" }, { status: 400 });
    }

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: u } = await server.auth.getUser();
    const user = u.user;
    if (!user) {
      console.error("Apply error: User not authenticated");
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { data: profile } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!profile) {
      console.error("Apply error: Profile not found for user:", user.id);
      return NextResponse.json({ error: "profile not found" }, { status: 400 });
    }

    const { data: student } = await admin
      .from("students")
      .select("id, resume_url")
      .eq("profile_id", profile.id)
      .maybeSingle();
    
    if (!student) {
      console.error("Apply error: Student profile not found for profile_id:", profile.id);
      return NextResponse.json({ error: "student not found" }, { status: 400 });
    }
    
    // Check if student has uploaded resume file
    let resumeUrl = (student.resume_url ?? "").trim();

    if (!resumeUrl) {
      try {
        const { data: files, error: listError } = await admin.storage
          .from("resumes")
          .list(String(student.id), {
            limit: 1,
            sortBy: { column: "created_at", order: "desc" },
          });

        if (!listError && files && files.length > 0) {
          const latest = files[0];
          const storagePath = `${student.id}/${latest.name}`;
          const { data: publicData } = admin.storage
            .from("resumes")
            .getPublicUrl(storagePath);

          if (publicData?.publicUrl) {
            resumeUrl = publicData.publicUrl;
            await admin
              .from("students")
              .update({ resume_url: resumeUrl })
              .eq("id", student.id);
            console.warn("Apply warning: Resume URL was missing in DB, recovered from storage.");
          }
        }
      } catch (storageErr) {
        console.error("Apply error: Failed checking storage for resume", storageErr);
      }
    }

    if (!resumeUrl) {
      console.error("Apply error: No resume found. Resume URL:", student.resume_url || "none");
      return NextResponse.json({
        error: "resume_required",
        message: "Please upload your resume in your profile before applying to internships."
      }, { status: 400 });
    }

    // Check for duplicate application
    const { data: existingApp } = await admin
      .from("applications")
      .select("id")
      .eq("internship_id", internship_id)
      .eq("student_id", student.id)
      .maybeSingle();

    if (existingApp) {
      console.error("Apply error: Duplicate application detected");
      return NextResponse.json({
        error: "already_applied",
        message: "You have already applied to this internship."
      }, { status: 400 });
    }

    const { error } = await admin.from("applications").insert({ 
      internship_id, 
      student_id: student.id, 
      cover_letter: cover_letter || null,
      status: 'applied'
    });
    
    if (error) {
      console.error("Apply error: Database insert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("Application successful:", { internship_id, student_id: student.id });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Apply error: Unexpected error:", e);
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
