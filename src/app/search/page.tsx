"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Card, Input, Button } from "@/components/ui";
import {
  Search,
  Building2,
  Loader2,
  Bell,
  Check,
  Users,
  MapPin,
  Laptop,
  ExternalLink,
  Briefcase,
  Sparkles,
  ChevronRight,
  BookOpen,
  Calendar as CalendarIcon,
  User,
  GraduationCap,
  Mail
} from "lucide-react";
import Link from "next/link";
import { MessageButton } from "@/components/MessageButton";

interface CompanyResult {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  logo_url: string | null;
  follower_count: number;
  username: string | null;
  is_following: boolean;
  internships: TopicSampleInternship[];
}

interface TopicSampleInternship {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  is_remote: boolean;
  stipend: string | null;
  openings: number | null;
  created_at: string;
  relevance_score: number | null;
  has_applied: boolean;
  company: {
    id: string;
    name: string;
    logo_url: string | null;
    follower_count: number;
    username: string | null;
    is_following: boolean;
  } | null;
  topics?: {
    id: string;
    name: string;
    category: string | null;
    relevance_score: number | null;
    is_following: boolean;
  }[];
}

interface InternshipResult extends TopicSampleInternship {
  description: string;
  topics: TopicSampleInternship["topics"];
}

interface TopicResult {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  follower_count: number;
  is_following: boolean;
  sample_internships: TopicSampleInternship[];
}

interface SearchResponse {
  companies: CompanyResult[];
  internships: InternshipResult[];
  topics: TopicResult[];
  users: UserResult[];
}

type ViewKey = "topics" | "internships" | "companies";
type AllViewKey = ViewKey | "all" | "people";
type IconRenderer = ComponentType<{ className?: string }>;

type RoleLabel = "student" | "company" | "admin" | string;

interface UserResult {
  profile_id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  role: RoleLabel;
  student: {
    id: string;
    university: string | null;
    degree: string | null;
    resume_url: string | null;
  } | null;
  company: {
    id: string;
    name: string | null;
    website: string | null;
    description: string | null;
  } | null;
  latest_application: {
    id: string;
    internship_id: string;
    internship_title: string | null;
    created_at: string;
  } | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [topicFollowLoading, setTopicFollowLoading] = useState<string | null>(null);
  const [applyState, setApplyState] = useState<Record<string, "idle" | "loading" | "applied" | "error">>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedCompany, setSelectedCompany] = useState<CompanyResult | null>(null);
  const [selectedInternship, setSelectedInternship] = useState<InternshipResult | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicResult | null>(null);
  const [activeView, setActiveView] = useState<AllViewKey>("all");

  useEffect(() => {
    if (!selectedCompany && !selectedInternship && !selectedTopic) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedCompany, selectedInternship, selectedTopic]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (query.trim().length < 2) {
      setErrorMessage("Please enter at least 2 characters");
      return;
    }

    setLoading(true);
    setSearched(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed");
      }

      setResults(data);
    } catch (error: any) {
      console.error("Search failed", error);
      setResults(null);
      setErrorMessage(error.message || "Failed to search. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleFollowCompany = async (companyId: string, isFollowing: boolean) => {
    setFollowLoading(companyId);
    try {
      const endpoint = "/api/companies/follow";
      const method = isFollowing ? "DELETE" : "POST";
      const url = isFollowing ? `${endpoint}?companyId=${companyId}` : endpoint;
      const body = isFollowing ? undefined : JSON.stringify({ companyId });

      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update follow status");
      }

      const nextFollowState = !isFollowing;

      setResults(prev => {
        if (!prev) return prev;
        const updateCompany = (company: CompanyResult) =>
          company.id === companyId
            ? {
                ...company,
                is_following: nextFollowState,
              }
            : company;

        const updateInternship = (internship: InternshipResult) =>
          internship.company && internship.company.id === companyId
            ? {
                ...internship,
                company: {
                  ...internship.company,
                  is_following: nextFollowState,
                },
              }
            : internship;

        const updateTopic = (topic: TopicResult) => ({
          ...topic,
          sample_internships: topic.sample_internships.map(sample =>
            sample.company && sample.company.id === companyId
              ? {
                  ...sample,
                  company: sample.company
                    ? { ...sample.company, is_following: nextFollowState }
                    : sample.company,
                }
              : sample
          ),
        });

        return {
          companies: prev.companies.map(updateCompany),
          internships: prev.internships.map(updateInternship),
          topics: prev.topics.map(updateTopic),
          users: prev.users,
        };
      });

      setSelectedCompany(prev =>
        prev && prev.id === companyId
          ? { ...prev, is_following: nextFollowState }
          : prev
      );

      setSelectedInternship(prev =>
        prev && prev.company && prev.company.id === companyId
          ? {
              ...prev,
              company: {
                ...prev.company,
                is_following: nextFollowState,
              },
            }
          : prev
      );

      setSelectedTopic(prev => {
        if (!prev) return prev;
        const updatedSample = prev.sample_internships.map(internship =>
          internship.company && internship.company.id === companyId
            ? {
                ...internship,
                company: internship.company
                  ? { ...internship.company, is_following: nextFollowState }
                  : internship.company,
              }
            : internship
        );

        return {
          ...prev,
          sample_internships: updatedSample,
        };
      });
    } catch (error) {
      console.error("Failed to toggle company follow", error);
    } finally {
      setFollowLoading(null);
    }
  };

  const toggleFollowTopic = async (topicId: string, isFollowing: boolean) => {
    setTopicFollowLoading(topicId);
    try {
      const endpoint = "/api/topics/follow";
      const method = isFollowing ? "DELETE" : "POST";
      const url = isFollowing ? `${endpoint}?topicId=${topicId}` : endpoint;
      const body = isFollowing ? undefined : JSON.stringify({ topicId });

      const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update follow status");
      }

      setResults(prev => {
        if (!prev) return prev;

        const updateTopicInternships = (internships: TopicResult["sample_internships"]) =>
          internships.map(sample => ({
            ...sample,
            topics: (sample.topics ?? []).map(topic =>
              topic.id === topicId
                ? { ...topic, is_following: !isFollowing }
                : topic
            ),
          }));

        return {
          companies: prev.companies,
          internships: prev.internships.map(internship => ({
            ...internship,
            topics: (internship.topics ?? []).map(topic =>
              topic.id === topicId
                ? { ...topic, is_following: !isFollowing }
                : topic
            ),
          })),
          topics: prev.topics.map(topic =>
            topic.id === topicId
              ? {
                  ...topic,
                  is_following: !isFollowing,
                  sample_internships: updateTopicInternships(topic.sample_internships),
                }
              : {
                  ...topic,
                  sample_internships: updateTopicInternships(topic.sample_internships),
                }
          ),
          users: prev.users,
        };
      });
    } catch (error) {
      console.error("Failed to toggle topic follow", error);
    } finally {
      setTopicFollowLoading(null);
    }
  };

  const applyToInternship = async (internshipId: string) => {
    setApplyState(prev => ({ ...prev, [internshipId]: "loading" }));
    try {
      const response = await fetch("/api/applications/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to apply");
      }

      setApplyState(prev => ({ ...prev, [internshipId]: "applied" }));

      setResults(prev => {
        if (!prev) return prev;

        const updateInternship = (internship: InternshipResult) =>
          internship.id === internshipId
            ? { ...internship, has_applied: true }
            : internship;

        const updateTopic = (topic: TopicResult) => ({
          ...topic,
          sample_internships: topic.sample_internships.map(sample =>
            sample.id === internshipId
              ? { ...sample, has_applied: true }
              : sample
          ),
        });

        return {
          companies: prev.companies.map(company => ({
            ...company,
            internships: company.internships.map(internship =>
              internship.id === internshipId
                ? { ...internship, has_applied: true }
                : internship
            ),
          })),
          internships: prev.internships.map(updateInternship),
          topics: prev.topics.map(updateTopic),
          users: prev.users,
        };
      });
    } catch (error) {
      console.error("Failed to apply", error);
      setApplyState(prev => ({ ...prev, [internshipId]: "error" }));
    }
  };

  const closeModals = () => {
    setSelectedCompany(null);
    setSelectedInternship(null);
    setSelectedTopic(null);
  };

  const resultCounts = useMemo(() => {
    if (!results) return { companies: 0, internships: 0, topics: 0, users: 0 };
    return {
      companies: results.companies.length,
      internships: results.internships.length,
      topics: results.topics.length,
      users: results.users.length,
    };
  }, [results]);

  const renderFollowButton = (
    isFollowing: boolean,
    onClick: () => void,
    loading: boolean,
    labelFollow = "Follow",
    labelFollowing = "Following"
  ) => {
    const baseClasses = "inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs transition";
    const followClasses = "border-purple-500/30 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30";
    const followingClasses = "border-green-500/30 bg-green-500/20 text-green-200 hover:bg-green-500/30";

    return (
      <Button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={`${baseClasses} ${isFollowing ? followingClasses : followClasses}`}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isFollowing ? (
          <Check className="h-3 w-3" />
        ) : (
          <Bell className="h-3 w-3" />
        )}
        {isFollowing ? labelFollowing : labelFollow}
      </Button>
    );
  };

  const totalResults = resultCounts.topics + resultCounts.internships + resultCounts.companies + resultCounts.users;
  const viewCounts: Record<AllViewKey, number> = {
    all: totalResults,
    topics: resultCounts.topics,
    internships: resultCounts.internships,
    companies: resultCounts.companies,
    people: resultCounts.users,
  };

  const coreViewOptions: { key: AllViewKey; label: string; icon: IconRenderer; count: number }[] = [
    { key: "all", label: "All", icon: Search, count: viewCounts.all },
    { key: "topics", label: "Topics", icon: Sparkles, count: viewCounts.topics },
    { key: "internships", label: "Internships", icon: Briefcase, count: viewCounts.internships },
    { key: "companies", label: "Companies", icon: Building2, count: viewCounts.companies },
    { key: "people", label: "People", icon: Users as IconRenderer, count: viewCounts.people }
  ];

  const extendedViewOptions = coreViewOptions;

  const topicsToRender = !loading && results ? results.topics : [];
  const internshipsToRender = !loading && results ? results.internships : [];
  const companiesToRender = !loading && results ? results.companies : [];
  const usersToRender = !loading && results ? results.users : [];

  const shouldShowTopics = topicsToRender.length > 0 && (activeView === "all" || activeView === "topics");
  const shouldShowInternships = internshipsToRender.length > 0 && (activeView === "all" || activeView === "internships");
  const shouldShowCompanies = companiesToRender.length > 0 && (activeView === "all" || activeView === "companies");
  const shouldShowUsers = usersToRender.length > 0 && (activeView === "all" || activeView === "people");

  const showEmptyState =
    !loading &&
    searched &&
    (!results || viewCounts[activeView] === 0);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold">
            Discover <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Opportunities</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Search topics, internships, and companies. Follow companies or topics, explore details, and apply instantly.
          </p>
        </header>

        <Card className="mt-8 space-y-6 border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, internships, or companies..."
                className="h-12 rounded-xl border-white/20 bg-white/10 pl-11 text-white placeholder:text-zinc-400 focus:border-purple-400 focus:ring-purple-400"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || query.trim().length < 2}
              className="h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 font-semibold text-white shadow-lg shadow-purple-500/25 transition hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
            </Button>
          </form>

          {errorMessage && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </div>
          )}

          {searched && results && !loading && (
            <div className="grid gap-4 text-xs text-zinc-400 md:grid-cols-4">
              <div className="rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 p-4 text-center">
                <div className="text-2xl font-semibold text-white">{totalResults}</div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-400">Total matches</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-lg font-semibold text-white">{resultCounts.topics}</div>
                <div>Topics</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-lg font-semibold text-white">{resultCounts.internships}</div>
                <div>Internships</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-lg font-semibold text-white">{resultCounts.companies}</div>
                <div>Companies</div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-lg font-semibold text-white">{resultCounts.users}</div>
                <div>People</div>
              </div>
            </div>
          )}

          {searched && results && (
            <div className="border-t border-white/10 pt-6">
              <div className="grid gap-2 sm:grid-cols-5">
                {extendedViewOptions.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setActiveView(key)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      activeView === key
                        ? "border-purple-500/60 bg-purple-500/20 text-purple-100 shadow-lg shadow-purple-500/20"
                        : "border-white/10 bg-white/5 text-zinc-300 hover:border-purple-400/40 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">{count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {/* Topics */}
            {shouldShowTopics && (
              <section>
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Topics matching "{query}"
                  </h2>
                  <span className="text-xs text-zinc-500">Follow topics to get notified when new internships match.</span>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {topicsToRender.map(topic => (
                    <div key={topic.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{topic.name}</h3>
                          {topic.category && (
                            <span className="mt-1 inline-block rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-purple-200">
                              {topic.category.replace("_", " ")}
                            </span>
                          )}
                          {topic.description && (
                            <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{topic.description}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-[11px] text-zinc-500">
                            <Users className="h-3 w-3" />
                            {topic.follower_count.toLocaleString()} followers
                          </div>
                        </div>
                        {renderFollowButton(
                          topic.is_following,
                          () => toggleFollowTopic(topic.id, topic.is_following),
                          topicFollowLoading === topic.id,
                          "Follow",
                          "Following"
                        )}
                      </div>

                      {topic.sample_internships.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Related internships</div>
                          {topic.sample_internships.map(internship => (
                            <button
                              key={internship.id}
                              onClick={() => setSelectedInternship(internship as InternshipResult)}
                              className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left text-sm text-zinc-300 transition hover:border-purple-400/40 hover:text-white"
                            >
                              <div className="flex items-center gap-2">
                                <Briefcase className="h-4 w-4 text-purple-300" />
                                <span className="font-medium text-white">{internship.title}</span>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                                {internship.is_remote ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Laptop className="h-3 w-3" /> Remote
                                  </span>
                                ) : internship.location ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {internship.location}
                                  </span>
                                ) : null}
                                {typeof internship.openings === "number" && (
                                  <span className="inline-flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {internship.openings} openings
                                  </span>
                                )}
                                {internship.relevance_score && (
                                  <span className="inline-flex items-center gap-1 text-purple-300">
                                    <Sparkles className="h-3 w-3" /> Match {Math.round(internship.relevance_score * 100)}%
                                  </span>
                                )}
                              </div>
                              {internship.company && (
                                <div className="mt-2 text-xs text-zinc-400">
                                  By {internship.company.name}
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Internships */}
            {shouldShowInternships && (
              <section>
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Internships matching "{query}"
                  </h2>
                  <span className="text-xs text-zinc-500">Apply directly or follow the company for updates.</span>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {internshipsToRender.map(internship => (
                    <div key={internship.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{internship.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            {internship.is_remote ? (
                              <span className="inline-flex items-center gap-1">
                                <Laptop className="h-3 w-3" /> Remote
                              </span>
                            ) : internship.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {internship.location}
                              </span>
                            ) : null}
                            {typeof internship.openings === "number" && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" /> {internship.openings} openings
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> {new Date(internship.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {internship.company && (
                            <button
                              onClick={() => setSelectedCompany(companiesToRender.find(c => c.id === internship.company!.id) || null)}
                              className="mt-3 inline-flex items-center gap-1 text-xs text-purple-200 hover:text-purple-100"
                            >
                              <Building2 className="h-3 w-3" />
                              {internship.company.name}
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            onClick={() => setSelectedInternship(internship)}
                            className="rounded-lg border border-white/10 bg-white/10 px-3 py-1 text-xs"
                          >
                            View details
                          </Button>
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-xs text-zinc-300">{internship.description}</p>

                      {(internship.topics ?? []).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(internship.topics ?? []).map(topic => (
                            <span key={topic.id} className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[11px] text-purple-200">
                              <Sparkles className="h-3 w-3" />
                              {topic.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          disabled={internship.has_applied || applyState[internship.id] === "loading"}
                          onClick={() => applyToInternship(internship.id)}
                          className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs font-semibold"
                        >
                          {internship.has_applied || applyState[internship.id] === "applied"
                            ? "Applied"
                            : applyState[internship.id] === "loading"
                            ? "Applying..."
                            : "Apply"}
                        </Button>
                        <button
                          onClick={() => setSelectedInternship(internship)}
                          className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                        >
                          Explore more
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Companies */}
            {shouldShowCompanies && (
              <section>
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Companies matching "{query}"
                  </h2>
                  <span className="text-xs text-zinc-500">Follow companies to stay informed about new internships.</span>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {companiesToRender.map(company => (
                    <div key={company.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-white">{company.name}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" /> {company.follower_count.toLocaleString()} followers
                            </span>
                            {company.website && (
                              <a
                                href={company.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                              >
                                <ExternalLink className="h-3 w-3" /> Website
                              </a>
                            )}
                          </div>
                          {company.description && (
                            <p className="mt-3 line-clamp-3 text-xs text-zinc-300">{company.description}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {renderFollowButton(
                            company.is_following,
                            () => toggleFollowCompany(company.id, company.is_following),
                            followLoading === company.id
                          )}
                          {company.username && (
                            <Link
                              href={`/profile/${company.username}`}
                              className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-purple-100"
                            >
                              View profile
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                          >
                            Explore internships
                          </button>
                        </div>
                      </div>

                      {company.internships.length > 0 ? (
                        <div className="mt-4 space-y-3">
                          <div className="text-[11px] uppercase tracking-wide text-zinc-500">Recent internships</div>
                          {company.internships.slice(0, 3).map(internship => (
                            <div key={internship.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-zinc-300">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-white">{internship.title}</span>
                                <button
                                  className="text-[11px] text-purple-200 hover:text-purple-100"
                                  onClick={() => setSelectedInternship(internshipsToRender.find(i => i.id === internship.id) || null)}
                                >
                                  View
                                </button>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                                {internship.is_remote ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Laptop className="h-3 w-3" /> Remote
                                  </span>
                                ) : internship.location ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> {internship.location}
                                  </span>
                                ) : null}
                                {typeof internship.openings === "number" && (
                                  <span className="inline-flex items-center gap-1">
                                    <Users className="h-3 w-3" /> {internship.openings} openings
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-zinc-500">No internships posted yet.</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* People */}
            {shouldShowUsers && (
              <section>
                <header className="mb-3 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">People matching "{query}"</h2>
                  <span className="text-xs text-zinc-500">Message students, companies, or admins directly.</span>
                </header>

                <div className="grid gap-4 md:grid-cols-2">
                  {usersToRender.map(user => {
                    const primaryName = user.display_name || user.username || user.email || "Unknown user";
                    const roleBadgeStyles: Record<RoleLabel, string> = {
                      student: "border-blue-500/30 bg-blue-500/10 text-blue-200",
                      company: "border-purple-500/30 bg-purple-500/10 text-purple-200",
                      admin: "border-amber-500/30 bg-amber-500/10 text-amber-200",
                    };
                    const roleBadgeClasses = roleBadgeStyles[user.role] ?? "border-white/20 bg-white/10 text-white/70";

                    const latestApp = user.latest_application;

                    return (
                      <div key={user.profile_id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-white/80" />
                              <h3 className="text-base font-semibold text-white">{primaryName}</h3>
                            </div>
                            {user.username && (
                              <div className="-mt-1 text-xs text-purple-200/80">
                                @{user.username}
                              </div>
                            )}
                            <span className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${roleBadgeClasses}`}>
                              {user.role}
                            </span>

                            {user.role === "student" && user.student && (
                              <div className="text-xs text-zinc-400 space-y-1">
                                {user.student.university && (
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-3 w-3" />
                                    {user.student.university}
                                  </div>
                                )}
                                {user.student.degree && (
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-3 w-3" />
                                    {user.student.degree}
                                  </div>
                                )}
                              </div>
                            )}

                            {user.role === "company" && user.company && (
                              <div className="text-xs text-zinc-400 space-y-1">
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-3 w-3" />
                                  {user.company.name}
                                </div>
                                {user.company.website && (
                                  <a
                                    href={user.company.website}
                                    className="flex items-center gap-2 text-blue-300 hover:text-blue-200"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Website
                                  </a>
                                )}
                              </div>
                            )}

                            {user.email && (
                              <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            )}

                            {latestApp && (
                              <div className="mt-2 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3 text-xs text-purple-100">
                                <div className="font-semibold">Latest application with your company</div>
                                <div className="mt-1 text-purple-200/80">
                                  {latestApp.internship_title ?? "Internship"}
                                </div>
                                <div className="text-[11px] text-purple-200/60">
                                  Applied on {new Date(latestApp.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {user.username && (
                              <Link
                                href={`/profile/${user.username}`}
                                className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-purple-100"
                              >
                                View profile
                                <ChevronRight className="h-3 w-3" />
                              </Link>
                            )}
                            <MessageButton
                              recipientProfileId={user.profile_id}
                              recipientName={primaryName}
                              applicationId={latestApp?.id}
                              variant="outline"
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {!loading && searched && (!results || (resultCounts.companies === 0 && resultCounts.internships === 0 && resultCounts.topics === 0)) && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center text-zinc-400">
                <BookOpen className="mx-auto mb-4 h-10 w-10 text-zinc-600" />
                No results found for "{query}". Try a different keyword.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Company Modal */}
      {selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedCompany.name}</h2>
                {selectedCompany.website && (
                  <a
                    href={selectedCompany.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200"
                  >
                    <ExternalLink className="h-4 w-4" /> Visit website
                  </a>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" /> {selectedCompany.follower_count.toLocaleString()} followers
                  </span>
                  {selectedCompany.username && (
                    <Link href={`/profile/${selectedCompany.username}`} className="inline-flex items-center gap-1 text-purple-200 hover:text-purple-100">
                      <Building2 className="h-4 w-4" /> Profile
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                {renderFollowButton(
                  selectedCompany.is_following,
                  () => toggleFollowCompany(selectedCompany.id, selectedCompany.is_following),
                  followLoading === selectedCompany.id
                )}
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-full border border-white/10 p-2 text-xl text-white hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedCompany.description && (
              <p className="mt-4 whitespace-pre-line text-sm text-zinc-300">{selectedCompany.description}</p>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Internships</h3>
              {selectedCompany.internships.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {selectedCompany.internships.map(internship => (
                    <div key={internship.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-white">{internship.title}</h4>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                            {internship.is_remote ? (
                              <span className="inline-flex items-center gap-1">
                                <Laptop className="h-3 w-3" /> Remote
                              </span>
                            ) : internship.location ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> {internship.location}
                              </span>
                            ) : null}
                            {typeof internship.openings === "number" && (
                              <span className="inline-flex items-center gap-1">
                                <Users className="h-3 w-3" /> {internship.openings} openings
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> {new Date(internship.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              disabled={internship.has_applied || applyState[internship.id] === "loading"}
                              onClick={() => applyToInternship(internship.id)}
                              className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-xs"
                            >
                              {internship.has_applied || applyState[internship.id] === "applied"
                                ? "Applied"
                                : applyState[internship.id] === "loading"
                                ? "Applying..."
                                : "Apply"}
                            </Button>
                            <button
                              onClick={() => setSelectedInternship(results?.internships.find(i => i.id === internship.id) || null)}
                              className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">This company has not posted internships yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Internship Modal */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedInternship.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  {selectedInternship.is_remote ? (
                    <span className="inline-flex items-center gap-1">
                      <Laptop className="h-4 w-4" /> Remote
                    </span>
                  ) : selectedInternship.location ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {selectedInternship.location}
                    </span>
                  ) : null}
                  {typeof selectedInternship.openings === "number" && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" /> {selectedInternship.openings} openings
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-4 w-4" /> {new Date(selectedInternship.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-full border border-white/10 p-2 text-xl text-white hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedInternship.company && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{selectedInternship.company.name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                      <Users className="h-3 w-3" />
                      {selectedInternship.company.follower_count.toLocaleString()} followers
                    </div>
                  </div>
                  {selectedInternship.company.username && (
                    <Link
                      href={`/profile/${selectedInternship.company.username}`}
                      className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-purple-100"
                    >
                      View profile
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-4 text-sm text-zinc-200">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Description</h3>
                <p className="mt-2 whitespace-pre-line text-zinc-300">{selectedInternship.description}</p>
              </div>

              {(selectedInternship.topics ?? []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Related Topics</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedInternship.topics ?? []).map(topic => (
                      <button
                        key={topic.id}
                        className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-200 hover:border-purple-400/40"
                        onClick={() => setSelectedTopic(results?.topics.find(t => t.id === topic.id) || null)}
                      >
                        <Sparkles className="h-3 w-3" />
                        {topic.name}
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4">
                <Button
                  className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-xs"
                  disabled={selectedInternship.has_applied || applyState[selectedInternship.id] === "loading"}
                  onClick={() => applyToInternship(selectedInternship.id)}
                >
                  {selectedInternship.has_applied || applyState[selectedInternship.id] === "applied"
                    ? "Applied"
                    : applyState[selectedInternship.id] === "loading"
                    ? "Applying..."
                    : "Apply"}
                </Button>
                {selectedInternship.company && selectedInternship.company.username && (
                  <MessageButton
                    recipientProfileId={selectedInternship.company.username}
                    recipientName={selectedInternship.company.name}
                    variant="outline"
                    className="text-xs"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Topic Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8">
          <div className="max-h-[85vh] w-full max-width-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900/95 p-6 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{selectedTopic.name}</h2>
                <div className="mt-2 flex items-center gap-3 text-sm text-zinc-400">
                  {selectedTopic.category && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-purple-200">
                      {selectedTopic.category.replace("_", " ")}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {selectedTopic.follower_count.toLocaleString()} followers
                  </span>
                </div>
                {selectedTopic.description && (
                  <p className="mt-3 text-sm text-zinc-300">{selectedTopic.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                {renderFollowButton(
                  selectedTopic.is_following,
                  () => toggleFollowTopic(selectedTopic.id, selectedTopic.is_following),
                  topicFollowLoading === selectedTopic.id
                )}
                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-full border border-white/10 p-2 text-xl text-white hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {selectedTopic.sample_internships.map(internship => (
                <div key={internship.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{internship.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                        {internship.is_remote ? (
                          <span className="inline-flex items-center gap-1">
                            <Laptop className="h-3 w-3" /> Remote
                          </span>
                        ) : internship.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {internship.location}
                          </span>
                        ) : null}
                        {typeof internship.openings === "number" && (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {internship.openings} openings
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" /> {new Date(internship.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {internship.company && (
                        <div className="mt-2 text-xs text-zinc-400">
                          {internship.company.name}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        disabled={internship.has_applied || applyState[internship.id] === "loading"}
                        onClick={() => applyToInternship(internship.id)}
                        className="rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-1 text-xs"
                      >
                        {internship.has_applied || applyState[internship.id] === "applied"
                          ? "Applied"
                          : applyState[internship.id] === "loading"
                          ? "Applying..."
                          : "Apply"}
                      </Button>
                      <button
                        onClick={() => setSelectedInternship(results?.internships.find(i => i.id === internship.id) || null)}
                        className="inline-flex items-center justify-center rounded-lg border border-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                      >
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
