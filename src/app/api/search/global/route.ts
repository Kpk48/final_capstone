import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSupabaseServer } from "@/lib/supabaseServer";

type MaybeArray<T> = T | T[] | null | undefined;

const firstOrNull = <T>(value: MaybeArray<T>): T | null => {
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }
  return value ?? null;
};

const toArray = <T>(value: MaybeArray<T>): T[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getCompanyUsername = (company: any): string | null => {
  if (!company) return null;
  if (Object.prototype.hasOwnProperty.call(company, "profiles")) {
    const username = firstOrNull(company.profiles)?.username ?? null;
    if (username) return username;
  }
  if (Object.prototype.hasOwnProperty.call(company, "profile")) {
    const username = firstOrNull(company.profile)?.username ?? null;
    if (username) return username;
  }
  return null;
};

interface RawCompany {
  id: string;
  profile_id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  follower_count: number | null;
  profile?: MaybeArray<{ username: string | null }>;
  profiles?: MaybeArray<{ username: string | null }>;
  internships?: MaybeArray<RawCompanyInternship>;
}

interface RawCompanyInternship {
  id: string;
  title: string;
  location: string | null;
  is_remote: boolean | null;
  stipend: string | null;
  openings: number | null;
  created_at: string;
  description?: string | null;
}

interface RawInternship {
  id: string;
  title: string;
  description: string;
  location: string | null;
  is_remote: boolean | null;
  stipend: string | null;
  openings: number | null;
  created_at: string;
  company_id: string;
  company?: MaybeArray<{
    id: string;
    profile_id: string;
    name: string;
    logo_url: string | null;
    follower_count: number | null;
    profiles?: MaybeArray<{ username: string | null }>;
  } | null>;
  internship_topics?: MaybeArray<RawInternshipTopic>;
}

interface RawInternshipTopic {
  relevance_score: number | null;
  topics?: MaybeArray<{
    id: string;
    name: string;
    category: string | null;
  } | RawTopic>;
}

interface RawTopic {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  follower_count: number | null;
  internship_topics?: MaybeArray<RawTopicInternship>;
}

interface RawTopicInternship {
  relevance_score: number | null;
  internships?: MaybeArray<{
    id: string;
    title: string;
    location: string | null;
    is_remote: boolean | null;
    stipend: string | null;
    openings: number | null;
    created_at: string;
    companies?: MaybeArray<{
      id: string;
      profile_id: string;
      name: string;
      logo_url: string | null;
      follower_count: number | null;
      profiles?: MaybeArray<{ username: string | null }>;
    } | RawCompany>;
  } | RawTopicInternshipEntry>;
}

interface RawTopicInternshipEntry {
  id: string;
  title: string;
  location: string | null;
  is_remote: boolean | null;
  stipend: string | null;
  openings: number | null;
  created_at: string;
  description?: string | null;
  companies?: MaybeArray<{
    id: string;
    profile_id: string;
    name: string;
    logo_url: string | null;
    follower_count: number | null;
    profiles?: MaybeArray<{ username: string | null }>;
  } | RawCompany>;
}

interface RawStudentProfile {
  id: string;
  university: string | null;
  degree: string | null;
  resume_url: string | null;
}

interface RawCompanyProfile {
  id: string;
  name: string;
  website: string | null;
  description: string | null;
}

interface RawProfileEntry {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  role: string;
  is_public: boolean | null;
  students?: MaybeArray<RawStudentProfile>;
  companies?: MaybeArray<RawCompanyProfile>;
}

interface RawApplicationRow {
  id: string;
  student_id: string;
  internship_id: string;
  created_at: string;
  internships: MaybeArray<{
    id: string;
    title: string;
    company_id: string;
  }>;
}

const MAX_COMPANIES = 15;
const MAX_INTERNSHIPS = 25;
const MAX_TOPICS = 10;
const MAX_TOPIC_SAMPLE = 3;
const MAX_USERS = 25;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const supa = getSupabaseAdmin();
    const server = await getSupabaseServer();

    const { data: { user } } = await server.auth.getUser();
    let profileId: string | null = null;
    let studentId: string | null = null;
    let companyId: string | null = null;

    if (user) {
      const { data: profile } = await supa
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (profile) {
        profileId = profile.id;

        const { data: student } = await supa
          .from("students")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (student) {
          studentId = student.id;
        }

        const { data: company } = await supa
          .from("companies")
          .select("id")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (company) {
          companyId = company.id;
        }
      }
    }

    const normalizedQuery = query.startsWith("@") ? query.slice(1) : query;
    const uniqueSearchTerms = Array.from(new Set([query, normalizedQuery].filter(Boolean)));

    const buildPattern = (term: string) => `%${term}%`;
    const searchPatterns = uniqueSearchTerms.map(buildPattern);
    const searchPattern = `%${query}%`;
    const companySelect = `
      id,
      profile_id,
      name,
      description,
      website,
      logo_url,
      follower_count,
      profile:profiles!inner(
        id,
        username
      ),
      internships(
        id,
        title,
        description,
        location,
        is_remote,
        stipend,
        openings,
        created_at
      )
    `;

    const { data: baseCompanies, error: companyError } = await supa
      .from("companies")
      .select(companySelect)
      .or(
        [
          `name.ilike.${searchPattern}`,
          `description.ilike.${searchPattern}`
        ].join(",")
      )
      .order("follower_count", { ascending: false })
      .limit(MAX_COMPANIES);

    if (companyError) {
      console.error("Search companies error", companyError);
      return NextResponse.json({ error: companyError.message }, { status: 500 });
    }

    let rawCompanies = baseCompanies ?? [];
    const existingCompanyIds = new Set(rawCompanies.map(company => company.id));

    const profileMatchClauses: string[] = [];
    searchPatterns.forEach(pattern => {
      profileMatchClauses.push(`username.ilike.${pattern}`);
      profileMatchClauses.push(`display_name.ilike.${pattern}`);
      profileMatchClauses.push(`email.ilike.${pattern}`);
    });
    uniqueSearchTerms.forEach(term => {
      profileMatchClauses.push(`username.eq.${term}`);
    });

    const profileMatchFilters = profileMatchClauses.join(",");

    const { data: profileMatches, error: profileSearchError } = await supa
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        email,
        role,
        is_public,
        students(
          id
        ),
        companies(
          id
        )
      `)
      .or(profileMatchFilters)
      .limit(MAX_USERS);

    if (profileSearchError) {
      console.error("Search company profiles error", profileSearchError);
      return NextResponse.json({ error: profileSearchError.message }, { status: 500 });
    }

    const additionalCompanyIds = new Set<string>();
    (profileMatches ?? []).forEach(match => {
      const companies = toArray(match.companies);
      companies.forEach(company => {
        if (company && !existingCompanyIds.has(company.id)) {
          additionalCompanyIds.add(company.id);
        }
      });
    });

    if (additionalCompanyIds.size > 0) {
      const { data: additionalCompanies, error: additionalCompanyError } = await supa
        .from("companies")
        .select(companySelect)
        .in("id", Array.from(additionalCompanyIds))
        .order("follower_count", { ascending: false });

      if (additionalCompanyError) {
        console.error("Search additional companies error", additionalCompanyError);
        return NextResponse.json({ error: additionalCompanyError.message }, { status: 500 });
      }

      if (additionalCompanies) {
        rawCompanies = [...rawCompanies, ...additionalCompanies];
      }
    }

    const companyIds = rawCompanies.map(c => c.id);

    // --- Fetch topics ---
    const { data: rawTopics, error: topicError } = await supa
      .from("topics")
      .select(`
        id,
        name,
        slug,
        category,
        description,
        follower_count,
        internship_topics(
          relevance_score,
          internships(
            id,
            title,
            description,
            location,
            is_remote,
            stipend,
            openings,
            created_at,
            companies(
              id,
              profile_id,
              name,
              logo_url,
              follower_count,
              profiles(username)
            )
          )
        )
      `)
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order("follower_count", { ascending: false })
      .limit(MAX_TOPICS);

    if (topicError) {
      console.error("Search topics error", topicError);
      return NextResponse.json({ error: topicError.message }, { status: 500 });
    }

    const topicIds = (rawTopics ?? []).map(t => t.id);

    // --- Fetch internships ---
    const internshipFilters = [
      `title.ilike.${searchPattern}`,
      `description.ilike.${searchPattern}`
    ];

    if (companyIds.length > 0) {
      internshipFilters.push(`company_id.in.(${companyIds.join(",")})`);
    }

    const { data: rawInternships, error: internshipError } = await supa
      .from("internships")
      .select(`
        id,
        title,
        description,
        location,
        is_remote,
        stipend,
        openings,
        created_at,
        company_id,
        company:companies(
          id,
          profile_id,
          name,
          logo_url,
          follower_count,
          profiles(username)
        ),
        internship_topics(
          relevance_score,
          topics(
            id,
            name,
            category
          )
        )
      `)
      .or(internshipFilters.join(","))
      .order("created_at", { ascending: false })
      .limit(MAX_INTERNSHIPS);

    if (internshipError) {
      console.error("Search internships error", internshipError);
      return NextResponse.json({ error: internshipError.message }, { status: 500 });
    }

    // Collect internship IDs for application status
    const internshipIdSet = new Set<string>();
    (rawInternships ?? []).forEach(row => internshipIdSet.add(row.id));
    (rawCompanies ?? []).forEach(company => {
      const internships = Array.isArray(company.internships)
        ? company.internships
        : company.internships
          ? [company.internships]
          : [];
      internships.forEach(i => internshipIdSet.add(i.id));
    });
    (rawTopics ?? []).forEach(topic => {
      const topicInternships = Array.isArray(topic.internship_topics)
        ? topic.internship_topics
        : topic.internship_topics
          ? [topic.internship_topics]
          : [];
      topicInternships.forEach(it => {
        const internship = Array.isArray(it.internships)
          ? it.internships[0]
          : it.internships;
        if (internship) {
          internshipIdSet.add(internship.id);
        }
      });
    });

    const profileSearchConditions: string[] = [];
    searchPatterns.forEach(pattern => {
      profileSearchConditions.push(`display_name.ilike.${pattern}`);
      profileSearchConditions.push(`email.ilike.${pattern}`);
      profileSearchConditions.push(`username.ilike.${pattern}`);
    });
    uniqueSearchTerms.forEach(term => {
      profileSearchConditions.push(`username.eq.${term}`);
    });

    let profilesQuery = supa
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        email,
        role,
        is_public,
        students(
          id,
          university,
          degree,
          resume_url
        ),
        companies(
          id,
          name,
          website,
          description
        )
      `)
      .or(profileSearchConditions.join(","))
      .order("display_name", { ascending: true })
      .limit(MAX_USERS);

    if (profileId) {
      profilesQuery = profilesQuery.neq("id", profileId);
    }

    const { data: rawProfiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      console.error("Search users error", profilesError);
    }

    let rawProfileEntries = rawProfiles ?? [];

    if (normalizedQuery) {
      const normalizedLower = normalizedQuery.toLowerCase();
      const hasExactUsername = rawProfileEntries.some(profile =>
        (profile.username ?? "").toLowerCase() === normalizedLower
      );

      if (!hasExactUsername) {
        const { data: exactProfiles, error: exactProfileError } = await supa
          .from("profiles")
          .select(`
            id,
            username,
            display_name,
            email,
            role,
            is_public,
            students(
              id,
              university,
              degree,
              resume_url
            ),
            companies(
              id,
              name,
              website,
              description
            )
          `)
          .eq("username", normalizedQuery)
          .limit(1);

        if (exactProfileError) {
          console.error("Exact username lookup error", exactProfileError);
        } else if (exactProfiles && exactProfiles.length > 0) {
          const newProfiles = exactProfiles.filter(profile =>
            rawProfileEntries.every(existing => existing.id !== profile.id)
          );

          if (newProfiles.length > 0) {
            rawProfileEntries = [...rawProfileEntries, ...newProfiles];
          }
        }
      }
    }

    const studentIds = new Set<string>();
    rawProfileEntries.forEach(profile => {
      const student = firstOrNull(profile.students);
      if (student?.id) {
        studentIds.add(student.id);
      }
    });

    const studentApplicationMap = new Map<string, {
      id: string;
      internship_id: string;
      internship_title: string | null;
      created_at: string;
    }>();

    if (companyId && studentIds.size > 0) {
      const { data: applicationRows, error: applicationError } = await supa
        .from("applications")
        .select(`
          id,
          student_id,
          internship_id,
          created_at,
          internships!inner(
            id,
            title,
            company_id
          )
        `)
        .in("student_id", Array.from(studentIds))
        .eq("internships.company_id", companyId)
        .order("created_at", { ascending: false });

      if (applicationError) {
        console.error("Applications lookup error", applicationError);
      } else {
        (applicationRows ?? []).forEach((row: RawApplicationRow) => {
          if (!studentApplicationMap.has(row.student_id)) {
            const internshipData = firstOrNull(row.internships);
            studentApplicationMap.set(row.student_id, {
              id: row.id,
              internship_id: row.internship_id,
              internship_title: internshipData?.title ?? null,
              created_at: row.created_at
            });
          }
        });
      }
    }

    let appliedSet = new Set<string>();
    if (studentId && internshipIdSet.size > 0) {
      const { data: appliedRows } = await supa
        .from("applications")
        .select("internship_id")
        .eq("student_id", studentId)
        .in("internship_id", Array.from(internshipIdSet));
      appliedSet = new Set((appliedRows ?? []).map(row => row.internship_id));
    }

    // Fetch follow status for companies/topics
    let companyFollowSet = new Set<string>();
    if (studentId && companyIds.length > 0) {
      const { data: companyFollowRows } = await supa
        .from("company_followers")
        .select("company_id")
        .eq("student_id", studentId)
        .in("company_id", companyIds);
      companyFollowSet = new Set((companyFollowRows ?? []).map(row => row.company_id));
    }

    let topicFollowSet = new Set<string>();
    if (studentId && topicIds.length > 0) {
      const { data: topicFollowRows } = await supa
        .from("topic_followers")
        .select("topic_id")
        .eq("student_id", studentId)
        .in("topic_id", topicIds);
      topicFollowSet = new Set((topicFollowRows ?? []).map(row => row.topic_id));
    }

    const mapCompany = (raw: RawCompany) => {
      const profile = firstOrNull(raw.profile) ?? firstOrNull(raw.profiles);
      const internships = toArray(raw.internships).map(internship => ({
        id: internship.id,
        title: internship.title,
        location: internship.location,
        is_remote: Boolean(internship.is_remote),
        stipend: internship.stipend,
        openings: internship.openings,
        created_at: internship.created_at,
        description: internship.description ?? null,
        has_applied: appliedSet.has(internship.id)
      }));

      return {
        id: raw.id,
        profile_id: raw.profile_id ?? null,
        name: raw.name,
        description: raw.description,
        website: raw.website,
        logo_url: raw.logo_url,
        follower_count: raw.follower_count ?? 0,
        username: profile?.username ?? null,
        is_following: companyFollowSet.has(raw.id),
        internships
      };
    };

    const mapInternship = (raw: RawInternship) => {
      const companyData = firstOrNull(raw.company);
      const topics = toArray(raw.internship_topics)
        .map(entry => {
          const topic = firstOrNull(entry.topics);
          if (!topic) return null;
          return {
            id: topic.id,
            name: topic.name,
            category: topic.category,
            relevance_score: entry.relevance_score ?? null,
            is_following: topicFollowSet.has(topic.id)
          };
        })
        .filter(Boolean);

      const followerCount = companyData?.follower_count ?? 0;

      return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        location: raw.location,
        is_remote: Boolean(raw.is_remote),
        stipend: raw.stipend,
        openings: raw.openings,
        created_at: raw.created_at,
        has_applied: appliedSet.has(raw.id),
        company: companyData
          ? {
              id: companyData.id,
              profile_id: (companyData as any).profile_id ?? null,
              name: companyData.name,
              logo_url: companyData.logo_url,
              follower_count: followerCount,
              username: getCompanyUsername(companyData),
              is_following: companyFollowSet.has(companyData.id)
            }
          : null,
        topics
      };
    };

    const mapTopic = (raw: RawTopic) => {
      const sampleInternships = toArray(raw.internship_topics)
        .map(entry => {
          const internship = firstOrNull(entry.internships);
          if (!internship) return null;

          const companyData = firstOrNull(internship.companies);

          const followerCount = companyData?.follower_count ?? 0;

          return {
            id: internship.id,
            title: internship.title,
            location: internship.location,
            is_remote: Boolean(internship.is_remote),
            stipend: internship.stipend,
            openings: internship.openings,
            created_at: internship.created_at,
            description: Object.prototype.hasOwnProperty.call(internship, "description")
              ? (internship as RawTopicInternshipEntry).description ?? null
              : null,
            relevance_score: entry.relevance_score ?? null,
            has_applied: appliedSet.has(internship.id),
            company: companyData
              ? {
                  id: companyData.id,
                  profile_id: (companyData as any).profile_id ?? null,
                  name: companyData.name,
                  logo_url: companyData.logo_url,
                  follower_count: followerCount,
                  username: getCompanyUsername(companyData),
                  is_following: companyFollowSet.has(companyData.id)
                }
              : null
          };
        })
        .filter(Boolean)
        .slice(0, MAX_TOPIC_SAMPLE);

      return {
        id: raw.id,
        name: raw.name,
        category: raw.category,
        description: raw.description,
        follower_count: raw.follower_count ?? 0,
        is_following: topicFollowSet.has(raw.id),
        sample_internships: sampleInternships
      };
    };

    const mapUser = (raw: RawProfileEntry) => {
      const student = firstOrNull(raw.students);
      const company = firstOrNull(raw.companies);
      const latestApplication = student && studentApplicationMap.get(student.id);

      return {
        profile_id: raw.id,
        username: raw.username,
        display_name: raw.display_name,
        email: raw.email,
        role: raw.role,
        is_public: raw.is_public ?? null,
        student: student
          ? {
              id: student.id,
              university: student.university,
              degree: student.degree,
              resume_url: student.resume_url
            }
          : null,
        company: company
          ? {
              id: company.id,
              name: company.name,
              website: company.website,
              description: company.description
            }
          : null,
        latest_application: latestApplication ?? null
      };
    };

    const companies = (rawCompanies ?? []).map(mapCompany);
    const internships = (rawInternships ?? []).map(mapInternship);
    const topics = (rawTopics ?? []).map(mapTopic);

    const users = rawProfileEntries.map(rawProfile => {
      const mapped = mapUser(rawProfile);

      if (rawProfile.role === "student") {
        const isPublic = Boolean(rawProfile.is_public);
        const isSelf = profileId ? rawProfile.id === profileId : false;

        if (!isPublic && !isSelf) {
          mapped.email = null;
          mapped.student = { private: true } as any;
        }
      }

      return mapped;
    });

    return NextResponse.json({
      companies,
      internships,
      topics,
      users
    });
  } catch (error: any) {
    console.error("Search global error", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform search" },
      { status: 500 }
    );
  }
}
