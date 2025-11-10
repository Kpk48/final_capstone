import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, updates } = body as { student_id: string; updates: Record<string, any> };
    if (!student_id || !updates) return NextResponse.json({ error: "student_id and updates required" }, { status: 400 });
    const supa = getSupabaseAdmin();
    const { error } = await supa.from("students").update(updates).eq("id", student_id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
