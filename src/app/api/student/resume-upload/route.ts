import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function extractPdfText(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfReaderModule = await import("pdfreader");
    const PdfReader = (pdfReaderModule as any).PdfReader ?? (pdfReaderModule as any).default;

    if (typeof PdfReader !== "function") {
      console.error("pdfreader did not expose a PdfReader constructor");
      return "";
    }

    const textChunks: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const reader = new PdfReader();
      reader.parseBuffer(Buffer.from(buffer), (err: Error | null, item: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (!item) {
          resolve();
          return;
        }

        if (item.text) {
          textChunks.push(item.text);
        }
      });
    });

    return textChunks.join(" \n").trim();
  } catch (error) {
    console.error("PDF text extraction failed:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
    }

    const server = await getSupabaseServer();
    const admin = getSupabaseAdmin();

    const { data: { user } } = await server.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
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

    // Upload to Supabase Storage
    // Sanitize file name to remove characters not allowed in storage keys
    const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const safeFileName = sanitizeFileName(file.name);
    const fileName = `${student.id}/${Date.now()}-${safeFileName}`;
    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await admin.storage
      .from("resumes")
      .upload(fileName, fileBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = admin.storage
      .from("resumes")
      .getPublicUrl(fileName);

    // Extract text from PDF
    const extractedText = await extractPdfText(fileBuffer);

    // Update student record with resume URL and extracted text
    await admin
      .from("students")
      .update({ 
        resume_url: publicUrl,
        resume_text: extractedText || null
      })
      .eq("id", student.id);

    // Generate embeddings for AI matching if text was extracted
    if (extractedText && extractedText.length > 50) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/embeddings/ingest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_type: "student_resume",
            owner_id: student.id,
            content: extractedText,
          }),
        });
      } catch (embError) {
        console.warn("Embeddings generation failed (AI matching may not work):", embError);
        // Don't fail the upload if embeddings fail
      }
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      textExtracted: extractedText.length > 0,
      textLength: extractedText.length,
    });
  } catch (error: any) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
