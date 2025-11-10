import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type NormalizedRole = "student" | "company" | "admin" | "guest" | "unknown";

const COMMON_ROUTE_PATTERNS: RegExp[] = [
  /^\/$/,
  /^\/dashboard$/,
  /^\/discover$/,
  /^\/notifications$/,
  /^\/search(?:\/.*)?$/,
  /^\/messages(?:\/.*)?$/,
  /^\/internships(?:\/[\w-]+)?$/,
  /^\/profile\/[^/]+$/,
];

const ROLE_SPECIFIC_PATTERNS: Record<NormalizedRole, RegExp[]> = {
  student: [/^\/student(\/.*)?$/],
  company: [/^\/company(\/.*)?$/],
  admin: [/^\/(admin|student|company)(\/.*)?$/],
  guest: [/^\/login$/, /^\/auth(\/.*)?$/],
  unknown: [],
};

function normalizeRole(role: string | null | undefined): NormalizedRole {
  if (!role) return "guest";
  const normalized = role.toLowerCase();
  if (normalized === "student" || normalized === "company" || normalized === "admin") {
    return normalized;
  }
  return "unknown";
}

function isRouteAllowedForRole(role: NormalizedRole, target: string): boolean {
  if (!target) return false;
  const sanitized = target.split("#")[0].split("?")[0];
  if (!sanitized.startsWith("/")) return false;

  const patterns = [...COMMON_ROUTE_PATTERNS, ...(ROLE_SPECIFIC_PATTERNS[role] ?? [])];
  return patterns.some((pattern) => pattern.test(sanitized));
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();
    
    if (!message) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        response: "Hi! I'm Carlos, but I need the GEMINI_API_KEY to be configured to help you. Please ask an administrator to set it up." 
      });
    }
    
    // Get basic user context - lightweight
    const server = await getSupabaseServer();
    const { data: { user } } = await server.auth.getUser();
    
    let userRole = "guest";
    let normalizedRole: NormalizedRole = "guest";

    if (user) {
      const admin = getSupabaseAdmin();
      const { data: profile } = await admin
        .from("profiles")
        .select("role, display_name")
        .eq("auth_user_id", user.id)
        .single();
      
      userRole = profile?.role || "unknown";
      normalizedRole = normalizeRole(profile?.role);
    }
    
    // Build conversation history
    const conversationHistory = history
      ?.slice(-5)
      .map((msg: any) => `${msg.role === "user" ? "User" : "Carlos"}: ${msg.content}`)
      .join("\n") || "";
    
    // Create prompt for Carlos
    const systemPrompt = `You are Carlos, a helpful navigation assistant for SkillSync - an AI-powered internship matching platform.

CURRENT USER ROLE: ${normalizedRole}

PLATFORM OVERVIEW:
SkillSync connects students with internship opportunities using AI-powered matching. Features include:
- AI-based recommendations using RAG (Retrieval Augmented Generation)
- Student profile management with resume parsing
- Company internship posting and applicant management  
- Admin analytics and data management
- Semantic search through resumes and internships
- Real-time application tracking

YOUR CAPABILITIES:
✅ Navigate users to any page automatically
✅ Access database information (respecting user roles)
✅ Provide statistics and insights
✅ Answer questions about features
✅ Help troubleshoot issues
✅ Explain how things work

ROLE-BASED ACCESS (MAINTAINED):
- Students: Can only see their own applications and available internships
- Companies: Can only see their own posted internships and applications
- Admins: Can see everything - all users, internships, applications, analytics

ROUTE ACCESS RULES:
- Students → /student/... (profile, browse, recommendations, following, applications, history)
- Companies → /company/... (profile, internships/new, matches, messages)
- Admins → /admin/... plus all company and student routes
- All roles → /search, /messages, /internships/[id], /dashboard, /profile/[username]
If a user requests a page outside their permissions, clearly explain the restriction and suggest an allowed alternative instead of navigating there.

Platform routes you can navigate to:
- /student/profile - Student profile page
- /student/browse - Browse internships
- /student/recommendations - AI recommendations
- /student/following - Manage followed topics and companies
- /student/applications - Track internship applications
- /student/history - View application history
- /company/profile - Company profile
- /company/internships/new - Post new internship
- /company/matches - View matched candidates
- /company/messages - Respond to applicants
- /admin/analytics - Admin analytics dashboard
- /admin/users - User management
- /admin/data - Data management (internships, companies, applications)
- /admin/tools - RAG search tools
- /dashboard - Main dashboard
- /search - Global search across the platform
- /messages - Universal inbox
- /internships/[id] - View detailed internship posting

FEATURES BY ROLE:

STUDENTS can:
- Edit profile and upload resume text
- Browse all available internships
- Apply to internships
- View AI-powered recommendations (based on their profile)
- Track application status (pending/accepted/rejected)
- Search internships by skills, location, company

COMPANIES can:
- Manage company profile
- Post new internships with details (title, description, location, stipend, skills)
- View all applications to their internships
- See matched candidates through AI
- Accept or reject applications
- Track internship performance

ADMINS can:
- View comprehensive analytics (users, internships, applications)
- See beautiful charts (pie, bar, line graphs)
- Generate AI insights about platform health
- Manage users (view, delete)
- Manage companies (view, delete)
- Manage internships (view, delete)
- Manage applications (view, delete)
- Use RAG search to semantically search resumes and internships
- View time-series data (30-day trends)
- Monitor platform activity

AI FEATURES:
- Resume embeddings using Gemini API (text-embedding-004 model)
- Semantic search with pgvector
- AI recommendations matching students to internships
- Chatbot assistance (that's you!)
- Natural language search

${conversationHistory ? `\n\nRECENT CONVERSATION:\n${conversationHistory}` : ""}

USER'S NEW MESSAGE: ${message}

YOUR JOB:
- Help users navigate the platform
- Explain features and how things work
- Answer general questions about SkillSync
- Take users to the right pages automatically

NAVIGATION - When users want to go somewhere, use [ACTION:navigate:/path]:
- "show me analytics" → "Let me take you there! 📊 [ACTION:navigate:/admin/analytics]"
- "go to my profile" → "Opening your profile! 👤 [ACTION:navigate:/student/profile]"
- "browse internships" → "Taking you to browse! 🔍 [ACTION:navigate:/student/browse]"
- "post internship" → "Let's post one! 📝 [ACTION:navigate:/company/internships/new]"

FOR DATA QUESTIONS:
If users ask about their specific data (applications, company details, etc), direct them to the relevant page:
- "my applications" → "To see your applications, [ACTION:navigate:/student/profile]"
- "my company details" → "To view your company details, [ACTION:navigate:/company/profile]"
- "how many applications?" → "Check your profile page! [ACTION:navigate:/student/profile]"

Be friendly, helpful, and concise (2-3 sentences).

${conversationHistory ? `\n\nRECENT CONVERSATION:\n${conversationHistory}` : ""}

USER'S MESSAGE: ${message}

Respond as Carlos:`;

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }]
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    let carlosResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || 
      "Sorry, I couldn't generate a response. Please try again.";
    
    // Parse action commands
    let action = null;
    const actionMatch = carlosResponse.match(/\[ACTION:(navigate|open|search):([^\]]+)\]/);
    
    if (actionMatch) {
      const [fullMatch, type, target] = actionMatch;
      // Remove action tag from response
      carlosResponse = carlosResponse.replace(fullMatch, "").trim();
      
      const trimmedTarget = target.trim();
      if (type === "navigate" && !isRouteAllowedForRole(normalizedRole, trimmedTarget)) {
        carlosResponse = `${carlosResponse}\n\nSorry, that page is restricted for your role.`;
      } else {
        action = {
          type,
          target: trimmedTarget,
          label: type === "navigate" ? "Go there now →" : "Open",
          autoExecute: true, // Auto-execute after small delay
        };
      }
    }
    
    return NextResponse.json({ 
      response: carlosResponse,
      action 
    });
  } catch (err: any) {
    console.error("Carlos chat error:", err);
    return NextResponse.json({ 
      response: "Oops! I encountered an error. Please try asking your question again, or contact support if the issue persists." 
    });
  }
}
