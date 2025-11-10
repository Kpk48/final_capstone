"use client";
import { useState } from "react";
import { Card, Input, Button } from "@/components/ui";
import { Search, Users, Building2, GraduationCap, Loader2, User, Globe, Mail } from "lucide-react";
import { MessageButton } from "@/components/MessageButton";

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  role: string;
  university?: string;
  degree?: string;
  website?: string;
}

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "company">("all");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() && roleFilter === "all") {
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);

      const res = await fetch(`/api/messaging/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.users || []);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student":
        return <GraduationCap className="h-5 w-5 text-blue-400" />;
      case "company":
        return <Building2 className="h-5 w-5 text-purple-400" />;
      default:
        return <User className="h-5 w-5 text-gray-400" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "student":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "company":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-6xl">
        {/* Header */}
        <section className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <Users className="h-8 w-8 text-indigo-400" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Discover & Connect
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Search for students, companies, and professionals to connect with
          </p>
        </section>

        {/* Search Section */}
        <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by name, email, university, or company..."
                  className="pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setRoleFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  roleFilter === "all"
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                All
              </button>
              <button
                onClick={() => setRoleFilter("student")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  roleFilter === "student"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                <GraduationCap className="h-4 w-4 inline mr-2" />
                Students
              </button>
              <button
                onClick={() => setRoleFilter("company")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  roleFilter === "company"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                <Building2 className="h-4 w-4 inline mr-2" />
                Companies
              </button>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <span className="ml-3 text-zinc-400">Searching...</span>
          </div>
        ) : searched && results.length === 0 ? (
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Search className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Results Found</h3>
            <p className="text-zinc-400 text-sm">
              Try adjusting your search query or filters
            </p>
          </Card>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((user) => (
              <Card
                key={user.profile_id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 hover:border-indigo-500/30 transition"
              >
                {/* User Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white line-clamp-1">
                        {user.name}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border capitalize ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {user.university && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <GraduationCap className="h-4 w-4" />
                      <span className="truncate">{user.university}</span>
                    </div>
                  )}

                  {user.degree && (
                    <div className="text-sm text-zinc-500 pl-6 truncate">
                      {user.degree}
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Globe className="h-4 w-4" />
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-indigo-400 transition"
                      >
                        {user.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Message Button */}
                <MessageButton
                  recipientProfileId={user.profile_id}
                  recipientName={user.name}
                  variant="outline"
                  className="w-full"
                />
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <Search className="mx-auto h-16 w-16 text-zinc-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Start Your Search
            </h3>
            <p className="text-zinc-400 text-sm mb-4">
              Find students, companies, and professionals to connect with
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-zinc-500">
              <span className="px-3 py-1 rounded-full bg-white/5">🎓 Students</span>
              <span className="px-3 py-1 rounded-full bg-white/5">🏢 Companies</span>
              <span className="px-3 py-1 rounded-full bg-white/5">💼 Professionals</span>
            </div>
          </Card>
        )}

        {/* Quick Stats */}
        {searched && results.length > 0 && (
          <div className="mt-6 text-center text-sm text-zinc-400">
            Found {results.length} {results.length === 1 ? "result" : "results"}
            {roleFilter !== "all" && ` in ${roleFilter}s`}
          </div>
        )}
      </div>
    </div>
  );
}
