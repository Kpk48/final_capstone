import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function requireAdmin() {
  const server = await getSupabaseServer();
  const admin = getSupabaseAdmin();
  const { data: u } = await server.auth.getUser();
  const user = u.user;
  if (!user) return false;
  const { data: profile } = await admin.from("profiles").select("role").eq("auth_user_id", user.id).maybeSingle();
  return profile?.role === "admin";
}

export async function POST(req: Request) {
  let analyticsData: any = {};
  
  try {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    
    const body = await req.json();
    analyticsData = body.analyticsData;
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not configured",
        insights: "AI insights unavailable. Configure GEMINI_API_KEY in .env.local to enable intelligent analytics."
      }, { status: 503 });
    }
    
    // Use correct API format for Google AI Studio keys (v1beta with x-goog-api-key header)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    
    const prompt = `You are an analytics expert for SkillSync, an internship matching platform. Analyze the following data and provide 3-5 key insights and actionable recommendations:

Platform Statistics:
- Total Users: ${analyticsData.totalUsers}
- Total Students: ${analyticsData.students}
- Total Companies: ${analyticsData.companies}
- Total Internships: ${analyticsData.internships}
- Total Applications: ${analyticsData.applications}

User Growth (last 30 days): ${JSON.stringify(analyticsData.userGrowth || [])}
Application Trends (last 30 days): ${JSON.stringify(analyticsData.applicationTrends || [])}
Top Skills: ${JSON.stringify(analyticsData.topSkills || [])}
Internships with most applications: ${JSON.stringify(analyticsData.topInternships || [])}

Provide insights in the following JSON format:
{
  "summary": "One-sentence overall summary",
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed description",
      "type": "positive" | "warning" | "info",
      "metric": "relevant metric or number"
    }
  ],
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ]
}

Keep insights concise, data-driven, and actionable. Focus on growth trends, user engagement, and platform health.`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || '',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Try to parse JSON from response
    let insights;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      insights = JSON.parse(jsonStr);
    } catch {
      // Fallback if parsing fails
      insights = {
        summary: "AI analysis completed",
        insights: [{
          title: "Analysis Available",
          description: text.substring(0, 500),
          type: "info",
          metric: ""
        }],
        recommendations: ["Review the detailed analysis", "Continue monitoring platform metrics"]
      };
    }
    
    return NextResponse.json({ insights });
  } catch (err: any) {
    console.error("AI insights error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to generate AI insights",
      details: "Ensure your GEMINI_API_KEY is valid and the model 'gemini-2.0-flash' is accessible."
    }, { status: 500 });
  }
}
