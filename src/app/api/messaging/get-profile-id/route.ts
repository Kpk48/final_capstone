import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get("student_id");
    const companyId = searchParams.get("company_id");

    if (studentId) {
      const { data: student } = await admin
        .from("students")
        .select("profile_id")
        .eq("id", studentId)
        .single();

      if (student) {
        return NextResponse.json({ profile_id: student.profile_id });
      }
    }

    if (companyId) {
      const { data: company } = await admin
        .from("companies")
        .select("profile_id")
        .eq("id", companyId)
        .single();

      if (company) {
        return NextResponse.json({ profile_id: company.profile_id });
      }
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (err: any) {
    console.error("Get profile ID error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
