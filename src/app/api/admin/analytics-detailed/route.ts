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
    
    const supa = getSupabaseAdmin();
    
    // Get role distribution
    const { data: roleData } = await supa
      .from("profiles")
      .select("role");
    
    const roleCounts = roleData?.reduce((acc, { role }) => {
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Get internships with application counts
    const { data: internships } = await supa
      .from("internships")
      .select(`
        id,
        title,
        location,
        stipend,
        created_at,
        companies!inner(name),
        applications(count)
      `)
      .order("created_at", { ascending: false })
      .limit(20);
    
    // Get applications over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: applicationsTimeSeries } = await supa
      .from("applications")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());
    
    // Group applications by date
    const applicationsByDate = applicationsTimeSeries?.reduce((acc, app) => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Get users over time (last 30 days)
    const { data: usersTimeSeries } = await supa
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString());
    
    const usersByDate = usersTimeSeries?.reduce((acc, user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Format internships data
    const internshipsWithApps = internships?.map(int => ({
      id: int.id,
      title: int.title,
      company: (int.companies as any)?.name || "Unknown",
      location: int.location,
      stipend: int.stipend,
      applications: int.applications?.[0]?.count || 0,
      created_at: int.created_at,
    })) || [];
    
    return NextResponse.json({
      roleCounts: [
        { name: "Students", value: roleCounts.student || 0, fill: "#3b82f6" },
        { name: "Companies", value: roleCounts.company || 0, fill: "#a855f7" },
        { name: "Admins", value: roleCounts.admin || 0, fill: "#ec4899" },
      ],
      internshipsWithApplications: internshipsWithApps,
      applicationTimeSeries: Object.entries(applicationsByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, applications: count })),
      userTimeSeries: Object.entries(usersByDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, users: count })),
    });
  } catch (err: any) {
    console.error("Detailed analytics error:", err);
    return NextResponse.json({ 
      error: err.message || "Failed to fetch analytics" 
    }, { status: 500 });
  }
}
