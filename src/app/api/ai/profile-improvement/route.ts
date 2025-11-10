import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
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

    // Get student details
    const { data: student } = await admin
      .from("students")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ error: "Student profile not found" }, { status: 404 });
    }

    // Get profile info
    const { data: profileInfo } = await admin
      .from("profiles")
      .select("display_name, username")
      .eq("id", profile.id)
      .single();

    // Prepare profile data for AI analysis
    const profileData = {
      display_name: profileInfo?.display_name || "Not set",
      username: profileInfo?.username || "Not set",
      university: student.university || "Not set",
      degree: student.degree || "Not set",
      graduation_year: student.graduation_year || "Not set",
      bio: student.bio || "Not set",
      resume_text: student.resume_text || "Not set",
      resume_url: student.resume_url ? "Uploaded" : "Not uploaded",
    };

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "AI service not configured",
        message: "Please set GEMINI_API_KEY in environment variables"
      }, { status: 500 });
    }

    // Prepare prompt for AI
    const prompt = `You are a career advisor and profile optimization expert. Analyze this student's profile and provide specific, actionable suggestions for improvement to help them get better internship matches.

Student Profile:
- Name: ${profileData.display_name}
- University: ${profileData.university}
- Degree: ${profileData.degree}
- Graduation Year: ${profileData.graduation_year}
- Bio: ${profileData.bio}
- Resume: ${profileData.resume_url}
- Resume Content Length: ${profileData.resume_text !== "Not set" ? profileData.resume_text.length + " characters" : "No resume text"}

Provide improvement suggestions in the following categories:

1. **Profile Completeness**: What information is missing or incomplete?
2. **Resume Quality**: How can they improve their resume content?
3. **Skills & Keywords**: What skills or keywords should they add to increase matches?
4. **Bio/Summary**: How can they make their bio more compelling?
5. **Experience & Projects**: What type of experience or projects would strengthen their profile?

Format your response as a JSON object with these exact keys: "completeness", "resume", "skills", "bio", "experience". Each value should be a string with 2-3 specific, actionable bullet points. Use HTML formatting with <strong> tags for emphasis and <ul><li> for lists.

Keep suggestions practical, specific, and encouraging. Focus on what they can do RIGHT NOW to improve their profile.`;

    // Call Gemini API (using format from Google AI Studio)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API failed: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Try to parse JSON from AI response
    let suggestions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiText.match(/```json\n?([\s\S]*?)\n?```/) || aiText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiText;
      suggestions = JSON.parse(jsonString);
    } catch (e) {
      // If JSON parsing fails, return raw text
      suggestions = {
        completeness: aiText.substring(0, 500),
        resume: "Unable to parse detailed suggestions. Please try again.",
        skills: "",
        bio: "",
        experience: ""
      };
    }

    return NextResponse.json({
      suggestions,
      profile_summary: {
        completeness_score: calculateCompletenessScore(profileData),
        has_resume: profileData.resume_url !== "Not uploaded",
        has_bio: profileData.bio !== "Not set",
        has_education: profileData.university !== "Not set" && profileData.degree !== "Not set",
      }
    });

  } catch (error: any) {
    console.error("AI Profile Improvement Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to generate suggestions" 
    }, { status: 500 });
  }
}

// Calculate profile completeness score (0-100)
function calculateCompletenessScore(profile: any): number {
  let score = 0;
  const fields = {
    display_name: 10,
    university: 15,
    degree: 15,
    graduation_year: 10,
    bio: 20,
    resume_text: 30,
  };

  for (const [field, points] of Object.entries(fields)) {
    if (profile[field] && profile[field] !== "Not set" && profile[field].toString().length > 0) {
      score += points;
    }
  }

  return score;
}
