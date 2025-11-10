import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { companyId } = await request.json();
    
    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }
    
    // Get student record
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .single();
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // Check if already following
    const { data: existing, error: existingError } = await admin
      .from("company_followers")
      .select("student_id")
      .eq("student_id", student.id)
      .eq("company_id", companyId)
      .limit(1)
      .maybeSingle();

    if (existingError && existingError.code && existingError.code !== "PGRST116") {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ message: "Already following this company" });
    }

    // Ensure company exists
    const { data: company } = await admin
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .maybeSingle();

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    // Follow company
    const { error } = await admin
      .from("company_followers")
      .insert({
        student_id: student.id,
        company_id: companyId
      });
    
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ message: "Already following this company" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Company followed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to follow company" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const admin = getSupabaseAdmin();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    
    if (!companyId) {
      return NextResponse.json({ error: "Company ID required" }, { status: 400 });
    }
    
    // Get student record
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    
    const { data: student } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", profile.id)
      .single();
    
    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }
    
    // Unfollow company
    const { error } = await admin
      .from("company_followers")
      .delete()
      .eq("student_id", student.id)
      .eq("company_id", companyId);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Company unfollowed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to unfollow company" }, { status: 500 });
  }
}
