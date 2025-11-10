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
    
    // Fetch all applications with comprehensive details
    const { data: rawApplications, error } = await supa
      .from("applications")
      .select(`
        id,
        status,
        created_at,
        updated_at,
        internships:internships!inner(
          id,
          title,
          description,
          location,
          stipend,
          companies:companies!inner(
            name,
            profiles:profiles!inner(display_name, email)
          )
        ),
        student:students!inner(
          id,
          resume_url,
          university,
          degree,
          graduation_year,
          profiles:profiles!inner(display_name, email)
        )
      `)
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const applications = rawApplications ?? [];

    const studentIds = Array.from(
      new Set(
        applications
          .map((app: any) => app.student?.id)
          .filter((id: string | null | undefined): id is string => Boolean(id))
      )
    );

    const skillsMap = new Map<string, string[]>();

    if (studentIds.length > 0) {
      const { data: skillRows, error: skillError } = await supa
        .from("student_skills")
        .select("student_id, skill_id")
        .in("student_id", studentIds);

      if (skillError) {
        console.error("Admin applications skills lookup error:", skillError);
      } else {
        const skillIdSet = new Set<number>();
        (skillRows ?? []).forEach((row: any) => {
          if (!row?.student_id || row.skill_id == null) return;
          const skillId = Number(row.skill_id);
          if (Number.isNaN(skillId)) return;
          skillIdSet.add(skillId);
          const existing = skillsMap.get(row.student_id) ?? [];
          existing.push(String(skillId));
          skillsMap.set(row.student_id, existing);
        });

        if (skillIdSet.size > 0) {
          const { data: skillRecords, error: skillsLookupError } = await supa
            .from("skills")
            .select("id, name")
            .in("id", Array.from(skillIdSet));

          if (skillsLookupError) {
            console.error("Admin applications skill name lookup error:", skillsLookupError);
          } else {
            const nameMap = new Map<number, string>();
            (skillRecords ?? []).forEach((skill) => {
              if (skill?.id == null) return;
              nameMap.set(skill.id, skill.name ?? `Skill ${skill.id}`);
            });

            skillsMap.forEach((ids, studentId) => {
              const resolved = ids
                .map((id) => {
                  const numericId = Number(id);
                  return Number.isNaN(numericId) ? null : nameMap.get(numericId) ?? null;
                })
                .filter((name): name is string => Boolean(name));
              skillsMap.set(studentId, resolved);
            });
          }
        }
      }
    }

    const formatted = applications.map((app: any) => {
      const student = app.student || null;
      const profile = student?.profiles || null;
      const educationSummary = [
        student?.degree,
        student?.university,
        student?.graduation_year ? `Class of ${student?.graduation_year}` : null,
      ]
        .filter(Boolean)
        .join(" • ") || null;
      const skillNames = skillsMap.get(student?.id ?? "") ?? [];

      return {
        id: app.id,
        status: app.status,
        created_at: app.created_at,
        updated_at: app.updated_at,
        internships: app.internships,
        students: {
          profiles: profile,
          resume_url: student?.resume_url ?? null,
          degree: student?.degree ?? null,
          university: student?.university ?? null,
          graduation_year: student?.graduation_year ?? null,
          education: educationSummary,
          skills: skillNames.join(", "),
          skills_list: skillNames,
        },
      };
    });

    return NextResponse.json({ applications: formatted });
  } catch (err: any) {
    console.error("Fetch applications error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch applications" }, { status: 500 });
  }
}
