"use client";
import { useState, useEffect } from "react";
import { Card, Button, Input } from "@/components/ui";
import { Search, Bell, BellOff, Sparkles, Building2, Check, Loader2, TrendingUp, Users, MapPin, Briefcase, Calendar as CalendarIcon, ExternalLink, Laptop } from "lucide-react";
import Link from "next/link";

interface Topic {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  follower_count: number;
  followed_at?: string;
}

interface CompanyInternship {
  id: string;
  title: string;
  location: string | null;
  is_remote: boolean;
  stipend: string | null;
  openings: number | null;
  created_at: string;
}

interface Company {
  id: string;
  name: string;
  website: string | null;
  logo_url: string | null;
  description: string | null;
  follower_count?: number;
  username?: string | null;
  internships?: CompanyInternship[];
  followed_at?: string;
}

export default function StudentFollowingPage() {
  const [activeTab, setActiveTab] = useState<"topics" | "companies">("topics");
  
  // Following state
  const [followedTopics, setFollowedTopics] = useState<Topic[]>([]);
  const [followedCompanies, setFollowedCompanies] = useState<Company[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Topic[]>([]);
  const [searching, setSearching] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadFollowing();
  }, []);

  useEffect(() => {
    if (activeTab === "topics" && searchQuery) {
      searchTopics();
    }
  }, [searchQuery, activeTab]);

  const loadFollowing = async () => {
    try {
      const res = await fetch("/api/student/following");
      const data = await res.json();
      setFollowedTopics(data.topics || []);
      setFollowedCompanies(data.companies || []);
    } catch (error) {
      console.error("Failed to load following:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchTopics = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`/api/topics/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.topics || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const followTopic = async (topicId: string) => {
    setActionLoading(topicId);
    try {
      const res = await fetch("/api/topics/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });

      if (res.ok) {
        await loadFollowing();
      }
    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const unfollowTopic = async (topicId: string) => {
    setActionLoading(topicId);
    try {
      const res = await fetch(`/api/topics/follow?topicId=${topicId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadFollowing();
      }
    } catch (error) {
      console.error("Unfollow failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const followCompany = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      const res = await fetch("/api/companies/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      if (res.ok) {
        await loadFollowing();
      }
    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const unfollowCompany = async (companyId: string) => {
    setActionLoading(companyId);
    try {
      const res = await fetch(`/api/companies/follow?companyId=${companyId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadFollowing();
      }
    } catch (error) {
      console.error("Unfollow failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const isTopicFollowed = (topicId: string) => {
    return followedTopics.some(t => t.id === topicId);
  };

  const isCompanyFollowed = (companyId: string) => {
    return followedCompanies.some(c => c.id === companyId);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "programming_language": return "text-blue-400 bg-blue-500/20 border-blue-500/30";
      case "framework": return "text-green-400 bg-green-500/20 border-green-500/30";
      case "domain": return "text-purple-400 bg-purple-500/20 border-purple-500/30";
      default: return "text-zinc-400 bg-zinc-500/20 border-zinc-500/30";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl space-y-8">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-semibold">
            Following{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              & Notifications
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Follow topics and companies to get notified about relevant opportunities
          </p>
        </section>

        {/* Info Banner */}
        <Card className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-300">Get Notified Instantly!</p>
              <p className="mt-1 text-xs text-blue-200/80">
                When companies post internships matching your followed topics, you'll receive instant notifications.
                AI automatically analyzes job postings to match your interests.
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("topics")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "topics"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Topics ({followedTopics.length})
          </button>
          <button
            onClick={() => setActiveTab("companies")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === "companies"
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Companies ({followedCompanies.length})
          </button>
        </div>

        {/* Topics Tab */}
        {activeTab === "topics" && (
          <>
            {/* Search Topics */}
            <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h2 className="text-lg font-semibold">Discover Topics</h2>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topics (e.g., Python, Machine Learning, React...)"
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {searching ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((topic) => (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{topic.name}</span>
                            {topic.category && (
                              <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(topic.category)}`}>
                                {topic.category.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          {topic.description && (
                            <p className="text-xs text-zinc-400 mt-1">{topic.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <TrendingUp className="h-3 w-3 text-zinc-500" />
                            <span className="text-xs text-zinc-500">{topic.follower_count} followers</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => isTopicFollowed(topic.id) ? unfollowTopic(topic.id) : followTopic(topic.id)}
                          disabled={actionLoading === topic.id}
                          className={`${
                            isTopicFollowed(topic.id)
                              ? "bg-green-500/20 hover:bg-red-500/20 text-green-400 hover:text-red-400 border-green-500/30 hover:border-red-500/30"
                              : "bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30"
                          } text-xs`}
                        >
                          {actionLoading === topic.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isTopicFollowed(topic.id) ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Following
                            </>
                          ) : (
                            <>
                              <Bell className="h-3 w-3 mr-1" />
                              Follow
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-zinc-400">
                      No topics found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* Followed Topics */}
            <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
              <h2 className="text-lg font-semibold mb-4">Your Followed Topics</h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                </div>
              ) : followedTopics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {followedTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{topic.name}</span>
                          {topic.category && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${getCategoryColor(topic.category)}`}>
                              {topic.category.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendingUp className="h-3 w-3 text-zinc-500" />
                          <span className="text-xs text-zinc-500">{topic.follower_count} followers</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => unfollowTopic(topic.id)}
                        disabled={actionLoading === topic.id}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 text-xs"
                      >
                        {actionLoading === topic.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <BellOff className="h-3 w-3 mr-1" />
                            Unfollow
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                  <p>Not following any topics yet</p>
                  <p className="text-xs mt-1">Search and follow topics to get notified about relevant opportunities</p>
                </div>
              )}
            </Card>
          </>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <Card className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
            <h2 className="text-lg font-semibold mb-4">Your Followed Companies</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : followedCompanies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {followedCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {company.logo_url ? (
                            <img
                              src={company.logo_url}
                              alt={company.name}
                              className="h-12 w-12 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                              <Building2 className="h-6 w-6 text-indigo-300" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white text-lg">{company.name}</h3>
                              {company.username && (
                                <Link
                                  href={`/profile/${company.username}`}
                                  className="inline-flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200"
                                  prefetch={false}
                                >
                                  View profile
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                              {company.website && (
                                <a
                                  href={company.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {company.website}
                                </a>
                              )}
                              {company.follower_count !== undefined && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3 w-3 text-purple-300" />
                                  {company.follower_count.toLocaleString()} followers
                                </span>
                              )}
                              {company.followed_at && (
                                <span className="inline-flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3 text-zinc-500" />
                                  Following since {new Date(company.followed_at).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {company.description && (
                              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                                {company.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => unfollowCompany(company.id)}
                          disabled={actionLoading === company.id}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 text-xs"
                        >
                          {actionLoading === company.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <BellOff className="h-3 w-3 mr-1" />
                              Unfollow
                            </>
                          )}
                        </Button>
                      </div>

                      {company.internships && company.internships.length > 0 ? (
                        <div className="border-t border-white/10 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                              Recent internships
                            </h4>
                            <span className="text-xs text-zinc-500">
                              {company.internships.length} posted
                            </span>
                          </div>

                          <div className="flex flex-col gap-3">
                            {company.internships.map((internship) => (
                              <Link
                                key={internship.id}
                                href={`/internships/${internship.id}`}
                                className="group rounded-lg border border-white/10 bg-white/5 p-3 hover:border-purple-400/40 hover:bg-white/10 transition"
                                prefetch={false}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Briefcase className="h-4 w-4 text-purple-300" />
                                      <span className="text-sm font-medium text-white group-hover:text-purple-200">
                                        {internship.title}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                                      {internship.is_remote ? (
                                        <span className="inline-flex items-center gap-1">
                                          <Laptop className="h-3 w-3" /> Remote
                                        </span>
                                      ) : internship.location ? (
                                        <span className="inline-flex items-center gap-1">
                                          <MapPin className="h-3 w-3" /> {internship.location}
                                        </span>
                                      ) : null}
                                      {internship.stipend && (
                                        <span className="inline-flex items-center gap-1">
                                          <Sparkles className="h-3 w-3" />
                                          Stipend: {internship.stipend}
                                        </span>
                                      )}
                                      {typeof internship.openings === "number" && (
                                        <span className="inline-flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {internship.openings} openings
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                                    Posted {new Date(internship.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-t border-white/10 pt-4 text-xs text-zinc-500 italic">
                          No internships posted yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-400">
                <Building2 className="h-12 w-12 mx-auto mb-3 text-zinc-600" />
                <p>Not following any companies yet</p>
                <p className="text-xs mt-1">Follow companies on their profile pages to get notified when they post new internships</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
