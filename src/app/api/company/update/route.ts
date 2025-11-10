import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { company_id, updates } = await req.json();
    if (!company_id || !updates) return NextResponse.json({ error: "company_id and updates required" }, { status: 400 });

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: u } = await server.auth.getUser();
    const user = u.user;
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // verify ownership
    const { data: profile } = await admin.from("profiles").select("id").eq("auth_user_id", user.id).maybeSingle();
    if (!profile) return NextResponse.json({ error: "profile not found" }, { status: 400 });
    const { data: company } = await admin.from("companies").select("id").eq("id", company_id).eq("profile_id", profile.id).maybeSingle();
    if (!company) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const { error } = await admin.from("companies").update(updates).eq("id", company_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "failed" }, { status: 500 });
  }
}
