import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = getSupabaseAdmin();
    const { id: internshipId } = await context.params;

    if (!internshipId) {
      return NextResponse.json({ error: "Internship id required" }, { status: 400 });
    }

    const { data, error } = await admin
      .from("internships")
      .select(
        `
        id,
        title,
        description,
        location,
        is_remote,
        stipend,
        openings,
        duration_weeks,
        requirements,
        created_at,
        deadline,
        companies:companies(
          id,
          name,
          website,
          logo_url,
          description,
          follower_count,
          profiles!inner(
            username
          )
        ),
        internship_topics(
          relevance_score,
          topics!inner(
            id,
            name,
            slug,
            category
          )
        )
      `
      )
      .eq("id", internshipId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load internship detail", error);
      return NextResponse.json({ error: "Failed to load internship" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Internship not found" }, { status: 404 });
    }

    const company = Array.isArray(data.companies) ? data.companies[0] : data.companies;
    const topicsRaw = data.internship_topics ?? [];
    const topics = topicsRaw.map((entry: any) => {
      const topic = Array.isArray(entry.topics) ? entry.topics[0] : entry.topics;
      return {
        id: topic?.id ?? null,
        name: topic?.name ?? "",
        slug: topic?.slug ?? "",
        category: topic?.category ?? null,
        relevance_score: entry.relevance_score ?? null,
      };
    });

    const companyProfileRaw = company && Array.isArray(company.profiles)
      ? company.profiles[0]
      : company?.profiles;
    const companyProfile = companyProfileRaw as any;

    const payload = {
      id: data.id,
      title: data.title,
      description: data.description,
      location: data.location,
      is_remote: data.is_remote,
      stipend: data.stipend,
      openings: data.openings,
      duration_weeks: data.duration_weeks,
      requirements: data.requirements,
      created_at: data.created_at,
      deadline: data.deadline,
      topics,
      company: company
        ? {
            id: company.id,
            name: company.name,
            website: company.website,
            logo_url: company.logo_url,
            description: company.description,
            follower_count: company.follower_count ?? 0,
            username: companyProfile?.username ?? null,
          }
        : null,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("Internship detail error", err);
    return NextResponse.json(
      { error: err?.message ?? "Unexpected error loading internship" },
      { status: 500 }
    );
  }
}
