import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get("student_id");
    const limit = Number(searchParams.get("limit") || 10);
    if (!student_id) return NextResponse.json({ error: "student_id required" }, { status: 400 });

    const supa = getSupabaseAdmin();
    const { data, error } = await supa.rpc("match_internships_for_student", { p_student_id: student_id, p_limit: limit });
    if (error) throw error;

    // join internships
    const ids = (data || []).map((d: any) => d.internship_id);
    if (!ids.length) return NextResponse.json([]);
    const { data: internships, error: iErr } = await supa
      .from("internships")
      .select("id, title, description, company:companies(name, id)")
      .in("id", ids);
    if (iErr) throw iErr;

    // attach scores
    const scoreMap = new Map<string, number>();
    for (const row of data as any[]) scoreMap.set(row.internship_id, row.score);
    const response = internships.map((i) => ({ ...i, score: scoreMap.get(i.id) || 0 }));

    return NextResponse.json(response.sort((a, b) => b.score - a.score));
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
