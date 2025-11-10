"use client";
import { useState } from "react";
import { Card, Button, Input, Label } from "@/components/ui";
import { Search, Sparkles, Database, AlertCircle, CheckCircle2, Loader2, User, Briefcase, X, Mail, GraduationCap, Building2, MapPin, Calendar, DollarSign, Clock, FileText, ExternalLink } from "lucide-react";

export default function AdminToolsPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setMessage({ type: "error", text: "Please enter a search query" });
      return;
    }

    setLoading(true);
    setMessage(null);
    setResults([]);

    try {
      const res = await fetch("/api/admin/rag-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Search failed" });
        return;
      }

      setResults(data.results || []);
      
      // Show warning or success message
      if (data.warning) {
        setMessage({ type: "error", text: data.warning });
      } else if (data.message) {
        setMessage({ type: "error", text: data.message });
      } else if (data.help) {
        setMessage({ type: "error", text: `${data.message || "No results"}. ${data.help}` });
      } else {
        setMessage({ 
          type: "success", 
          text: `Found ${data.results?.length || 0} results${data.totalEmbeddings ? ` out of ${data.totalEmbeddings} total embeddings` : ''}` 
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Search failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-8">
        {/* Header */}
        <section>
          <h1 className="text-3xl font-semibold">
            RAG{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Search Tools
            </span>
          </h1>
          <p className="mt-2 text-sm text-zinc-300/80">
            Search through student resumes and internship descriptions using AI-powered semantic search.
          </p>
        </section>

        {/* Search Form */}
        <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
          <form onSubmit={onSearch} className="space-y-4">
            <div>
              <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Sparkles className="h-4 w-4 text-purple-400" />
                Semantic Search Query
              </Label>
              <div className="mt-2 flex gap-3">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'Looking for React developers with 2+ years experience'"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-sm">
              <Database className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium text-blue-300">How it works</p>
                <p className="mt-1 text-xs text-blue-200/80">
                  This tool uses AI embeddings to find semantically similar content. 
                  It searches through student resumes and internship descriptions stored in the vector database.
                </p>
              </div>
            </div>
          </form>
        </Card>

        {/* Message */}
        {message && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              message.type === "success"
                ? "border-green-500/20 bg-green-500/10 text-green-400"
                : "border-red-500/20 bg-red-500/10 text-red-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-200">
              Search Results ({results.length})
            </h2>
            {results.map((result, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedResult(result);
                  setShowModal(true);
                }}
                className="cursor-pointer"
              >
                <Card className="rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-lg hover:border-purple-500/30 hover:bg-white/15 transition-all"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.owner_type === "student_resume" ? (
                      <User className="h-4 w-4 text-purple-400" />
                    ) : (
                      <Briefcase className="h-4 w-4 text-pink-400" />
                    )}
                    <span className="text-xs font-medium text-purple-400">
                      {result.owner_type === "student_resume" ? "Student Resume" : "Internship"}
                    </span>
                  </div>
                  <span className="text-xs text-zinc-400">
                    Similarity: {(result.similarity * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                  {result.content}
                </p>
                {result.details && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-purple-300">
                    <span>Click to view details</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                )}
              </Card>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && message?.type === "success" && (
          <Card className="rounded-xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur-xl">
            <Search className="mx-auto h-12 w-12 text-zinc-500" />
            <p className="mt-3 text-sm text-zinc-400">
              No results found for your query. Try different keywords.
            </p>
          </Card>
        )}

        {/* Feature Status */}
        {!message && results.length === 0 && (
          <Card className="rounded-xl border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-300">AI Features Status</p>
                <p className="mt-1 text-xs text-yellow-200/80">
                  If you see errors, make sure you've:
                </p>
                <ul className="mt-2 ml-4 list-disc space-y-1 text-xs text-yellow-200/70">
                  <li>Enabled pgvector extension in Supabase</li>
                  <li>Set GEMINI_API_KEY in .env.local</li>
                  <li>Created embeddings by saving student profiles or internships</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        {/* Detail Modal */}
        {showModal && selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-purple-950/90 via-black/90 to-black/90 backdrop-blur-xl shadow-2xl">
              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <X className="h-5 w-5 text-zinc-400" />
              </button>

              {/* Modal Content */}
              <div className="p-8">
                {selectedResult.owner_type === "student_resume" ? (
                  <StudentDetailsModal student={selectedResult.details} similarity={selectedResult.similarity} />
                ) : (
                  <InternshipDetailsModal internship={selectedResult.details} similarity={selectedResult.similarity} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Student Details Modal Component
function StudentDetailsModal({ student, similarity }: { student: any; similarity: number }) {
  if (!student) return <div className="text-zinc-400">No student details available</div>;
  
  const profile = Array.isArray(student.profile) ? student.profile[0] : student.profile;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
          <User className="h-8 w-8 text-purple-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{profile?.display_name || "Student"}</h2>
          <p className="text-sm text-zinc-400 mt-1">{profile?.email}</p>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
            Match: {(similarity * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-purple-400" />
          Education
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoCard label="University" value={student.university || "Not specified"} />
          <InfoCard label="Degree" value={student.degree || "Not specified"} />
          <InfoCard label="Graduation Year" value={student.graduation_year || "Not specified"} />
        </div>
      </div>

      {/* Bio */}
      {student.bio && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Bio
          </h3>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-300 leading-relaxed">{student.bio}</p>
          </div>
        </div>
      )}

      {/* Resume */}
      {student.resume_url && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Resume
          </h3>
          <a
            href={student.resume_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 transition"
          >
            <ExternalLink className="h-4 w-4" />
            View Resume
          </a>
        </div>
      )}

      {/* Contact */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mail className="h-5 w-5 text-purple-400" />
          Contact
        </h3>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{profile?.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Internship Details Modal Component
function InternshipDetailsModal({ internship, similarity }: { internship: any; similarity: number }) {
  if (!internship) return <div className="text-zinc-400">No internship details available</div>;
  
  const company = Array.isArray(internship.company) ? internship.company[0] : internship.company;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-pink-500/20 border border-pink-500/30">
          <Briefcase className="h-8 w-8 text-pink-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{internship.title}</h2>
          <p className="text-sm text-zinc-400 mt-1">{company?.name}</p>
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium">
            Match: {(similarity * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Company Info */}
      {company && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-pink-400" />
            Company
          </h3>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-white">{company.name}</span>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Website
                </a>
              )}
            </div>
            {company.description && (
              <p className="text-sm text-zinc-400">{company.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-pink-400" />
          Description
        </h3>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-sm text-zinc-300 leading-relaxed">{internship.description}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DetailCard
          icon={<MapPin className="h-4 w-4" />}
          label="Location"
          value={internship.is_remote ? "Remote" : internship.location || "Not specified"}
        />
        <DetailCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Stipend"
          value={internship.stipend ? `₹${internship.stipend.toLocaleString()}/month` : "Unpaid"}
        />
        <DetailCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Openings"
          value={internship.openings || "Not specified"}
        />
        <DetailCard
          icon={<Clock className="h-4 w-4" />}
          label="Duration"
          value={internship.duration_weeks ? `${internship.duration_weeks} weeks` : "Not specified"}
        />
        {internship.deadline && (
          <DetailCard
            icon={<Calendar className="h-4 w-4" />}
            label="Deadline"
            value={new Date(internship.deadline).toLocaleDateString()}
          />
        )}
      </div>

      {/* Requirements */}
      {internship.requirements && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-pink-400" />
            Requirements
          </h3>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-zinc-300 leading-relaxed">{internship.requirements}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function InfoCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <p className="text-xs text-zinc-500 mb-1">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}

function DetailCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: any }) {
  return (
    <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-start gap-3">
      <div className="text-pink-400 mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 mb-1">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </div>
  );
}
