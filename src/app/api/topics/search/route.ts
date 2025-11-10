import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "20");
    
    const admin = getSupabaseAdmin();
    
    let dbQuery = admin
      .from("topics")
      .select("id, name, slug, category, description, follower_count")
      .order("follower_count", { ascending: false })
      .limit(limit);
    
    // Search by name if query provided
    if (query) {
      dbQuery = dbQuery.ilike("name", `%${query}%`);
    }
    
    const { data: topics, error } = await dbQuery;
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ topics: topics || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to search topics" }, { status: 500 });
  }
}
