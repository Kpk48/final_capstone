import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function requireAdmin() {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  const { data: u } = await server.auth.getUser();
  const user = u.user;
  if (!user) return false;
  const { data: profile } = await admin.from("profiles").select("role").eq("auth_user_id", user.id).maybeSingle();
  return profile?.role === "admin";
}

export async function GET() {
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    
    const admin = getSupabaseAdmin();
    
    // Check 1: API Key
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    
    // Check 2: Embeddings count
    const { count: embeddingCount, error: countError } = await admin
      .from("embeddings")
      .select("*", { count: "exact", head: true });
    
    // Check 3: Sample embeddings
    const { data: sampleEmbeddings, error: sampleError } = await admin
      .from("embeddings")
      .select("id, owner_type, content, created_at")
      .limit(5);
    
    // Check 4: RPC function exists
    let rpcExists = false;
    try {
      await admin.rpc('match_embeddings', {
        query_embedding: new Array(768).fill(0),
        match_threshold: 0.9,
        match_count: 1
      });
      rpcExists = true;
    } catch (err: any) {
      rpcExists = false;
    }
    
    return NextResponse.json({
      status: "RAG Search Status Check",
      checks: {
        apiKey: {
          configured: hasApiKey,
          status: hasApiKey ? "✅ Configured" : "❌ Missing",
          action: hasApiKey ? null : "Add GEMINI_API_KEY to .env.local"
        },
        embeddings: {
          count: embeddingCount || 0,
          status: (embeddingCount || 0) > 0 ? "✅ Embeddings exist" : "❌ No embeddings",
          action: (embeddingCount || 0) > 0 ? null : "Students need to save profiles with resume text",
          samples: sampleEmbeddings?.map(e => ({
            id: e.id,
            type: e.owner_type,
            preview: e.content.substring(0, 100) + "...",
            created: e.created_at
          })) || []
        },
        searchFunction: {
          exists: rpcExists,
          status: rpcExists ? "✅ match_embeddings function exists" : "⚠️ Function missing (will show all results)",
          action: rpcExists ? null : "Run SEMANTIC_SEARCH_FUNCTION.sql for true semantic search"
        }
      },
      overall: {
        ready: hasApiKey && (embeddingCount || 0) > 0,
        message: hasApiKey && (embeddingCount || 0) > 0 
          ? "🎉 RAG search is ready! Go to /admin/tools to search."
          : "⚠️ Setup incomplete. Follow the actions above."
      },
      nextSteps: [
        !hasApiKey ? "1. Add GEMINI_API_KEY to .env.local" : null,
        (embeddingCount || 0) === 0 ? "2. Register as student → Fill profile with resume text → Save" : null,
        !rpcExists ? "3. (Optional) Run SEMANTIC_SEARCH_FUNCTION.sql for better search" : null,
        "4. Test at /admin/tools"
      ].filter(Boolean)
    });
  } catch (err: any) {
    console.error("RAG status check error:", err);
    return NextResponse.json({ 
      error: err.message || "Status check failed" 
    }, { status: 500 });
  }
}
