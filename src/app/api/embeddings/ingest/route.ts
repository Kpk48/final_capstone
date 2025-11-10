import { NextRequest, NextResponse } from "next/server";
import { embedText } from "@/lib/embeddings";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function chunkText(input: string, maxLen = 1500): string[] {
  const sentences = input.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).length > maxLen) {
      if (current) chunks.push(current.trim());
      current = s;
    } else {
      current += (current ? " " : "") + s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [input];
}

export async function POST(req: NextRequest) {
  try {
    const { owner_type, owner_id, content } = await req.json();
    if (!owner_type || !owner_id || !content) {
      return NextResponse.json({ error: "owner_type, owner_id, content required" }, { status: 400 });
    }
    
    // Check if GEMINI_API_KEY is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not configured. Add it to .env.local to enable AI features." 
      }, { status: 503 });
    }
    
    const chunks = chunkText(content);
    const vectors = await embedText(chunks);
    const admin = getSupabaseAdmin();
    const rows = chunks.map((c, i) => ({ owner_type, owner_id, content: c, embedding: vectors[i] }));
    const { error } = await admin.from("embeddings").insert(rows);
    if (error) throw error;
    return NextResponse.json({ inserted: rows.length });
  } catch (e: any) {
    console.error("Embeddings ingest error:", e);
    return NextResponse.json({ 
      error: e.message || "Failed to generate embeddings" 
    }, { status: 500 });
  }
}
