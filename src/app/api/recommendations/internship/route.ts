import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const internship_id = searchParams.get("internship_id");
    const limit = Number(searchParams.get("limit") || 10);
    if (!internship_id) return NextResponse.json({ error: "internship_id required" }, { status: 400 });

    const supa = getSupabaseAdmin();

    // Attempt to fetch AI match scores, but fall back gracefully if none exist
    const { data: matchData, error: matchError } = await supa.rpc("match_students_for_internship", {
      p_internship_id: internship_id,
      p_limit: limit,
    });
    if (matchError) throw matchError;

    const scoreMap = new Map<string, number>();
    for (const row of (matchData || []) as any[]) {
      scoreMap.set(row.student_id, row.score);
    }

    const { data: applications, error: appErr } = await supa
      .from("applications")
      .select("id, student_id, status, created_at")
      .eq("internship_id", internship_id)
      .order("created_at", { ascending: false });
    if (appErr) throw appErr;

    if (!applications?.length) {
      return NextResponse.json([]);
    }

    const studentIds = Array.from(
      new Set(applications.map((a) => a.student_id).filter((id): id is string => Boolean(id)))
    );

    if (!studentIds.length) {
      return NextResponse.json([]);
    }

    const { data: students, error: sErr } = await supa
      .from("students")
      .select("*, profile:profiles(display_name, email)")
      .in("id", studentIds);
    if (sErr) throw sErr;

    const applicationMap = new Map<string, { id: string; status: string | null; created_at: string | null }>();
    for (const app of applications) {
      applicationMap.set(app.student_id, {
        id: app.id,
        status: app.status ?? null,
        created_at: app.created_at ?? null,
      });
    }

    const response = students.map((student) => ({
      ...student,
      score: scoreMap.get(student.id) ?? 0,
      application: applicationMap.get(student.id) ?? null,
    }));

    // Prioritise matched candidates (higher scores first), then fall back to most recent applications
    response.sort((a, b) => {
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      const aCreated = a.application?.created_at ? new Date(a.application.created_at).getTime() : 0;
      const bCreated = b.application?.created_at ? new Date(b.application.created_at).getTime() : 0;
      return bCreated - aCreated;
    });

    return NextResponse.json(response);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
