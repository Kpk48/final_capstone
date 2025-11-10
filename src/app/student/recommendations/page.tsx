"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { Sparkles, Building2, MapPin, Laptop, Loader2, BrainCircuit, Lightbulb, X, TrendingUp, FileText, Award, Zap, Target, Edit } from "lucide-react";

export default function StudentRecommendationsPage() {
    const [studentId, setStudentId] = useState<string | null>(null);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showImprovements, setShowImprovements] = useState(false);
    const [improvementLoading, setImprovementLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<any>(null);

    useEffect(() => {
        async function run() {
            setLoading(true);
            const me = await fetch("/api/me").then((r) => r.json());
            const sid = me?.student_id ?? null;
            setStudentId(sid);
            if (sid) {
                const recs = await fetch(`/api/recommendations/student?student_id=${sid}`).then((r) =>
                    r.json()
                );
                setItems(recs ?? []);
            }
            setLoading(false);
        }
        run();
    }, []);

    const getProfileImprovements = async () => {
        setImprovementLoading(true);
        setShowImprovements(true);
        try {
            const response = await fetch('/api/ai/profile-improvement', {
                method: 'POST',
            });
            
            if (!response.ok) throw new Error('Failed to get suggestions');
            
            const data = await response.json();
            setSuggestions(data);
        } catch (error) {
            console.error('Error getting improvements:', error);
            setSuggestions({
                error: 'Failed to load suggestions. Please try again.'
            });
        } finally {
            setImprovementLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
            {/* Subtle purple-pink lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-10">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-purple-400">
                        <BrainCircuit className="h-6 w-6" />
                        <Sparkles className="h-5 w-5 text-pink-400" />
                    </div>
                    <h1 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        AI Internship Recommendations
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Personalized internship suggestions based on your resume, skills, and profile insights.
                    </p>
                    
                    {/* Profile Improvement Button */}
                    {!loading && studentId && (
                        <div className="mt-4">
                            <Button
                                onClick={getProfileImprovements}
                                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2 mx-auto"
                            >
                                <Lightbulb className="h-4 w-4" />
                                Get AI Profile Improvement Tips
                            </Button>
                        </div>
                    )}
                </div>

                {/* Loading state */}
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        <span className="ml-3 text-zinc-400 text-sm">Fetching your recommendations…</span>
                    </div>
                ) : !studentId ? (
                    <p className="text-sm text-zinc-400 text-center">
                        No student profile found. Please complete your{" "}
                        <a href="/student/profile" className="underline text-purple-400 hover:text-pink-400">
                            profile setup
                        </a>{" "}
                        to receive AI recommendations.
                    </p>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-zinc-400">
                        <Sparkles className="h-6 w-6 text-purple-400 mb-2" />
                        <p>No recommendations available yet. Try updating your resume or skills!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {items.map((i) => (
                            <Card
                                key={i.id}
                                className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl transition-transform hover:-translate-y-1 hover:border-purple-400/40"
                            >
                                <div className="flex flex-col gap-3">
                                    {/* Title and Company */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">{i.title}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                                                <Building2 className="h-4 w-4 text-purple-400" />
                                                {i.company?.name ?? "Unknown Company"}
                                            </div>
                                        </div>
                                        <span
                                            className={`text-xs font-semibold ${
                                                i.score > 0.8
                                                    ? "text-green-400"
                                                    : i.score > 0.5
                                                        ? "text-yellow-400"
                                                        : "text-red-400"
                                            }`}
                                        >
                      Score {(i.score * 100).toFixed(0)}%
                    </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                                        {i.description}
                                    </p>

                                    {/* Meta Info */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300">
                      {i.is_remote ? (
                          <>
                              <Laptop className="h-3 w-3 text-purple-400" /> Remote
                          </>
                      ) : (
                          <>
                              <MapPin className="h-3 w-3 text-pink-400" />{" "}
                              {i.location || "Onsite"}
                          </>
                      )}
                    </span>
                                    </div>

                                    {/* Apply Button */}
                                    <div className="pt-2">
                                        <Button
                                            onClick={() => (window.location.href = "/student/browse")}
                                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md shadow-purple-500/20"
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* AI Profile Improvement Modal */}
                {showImprovements && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
                        <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-blue-500/30 bg-gradient-to-br from-black via-blue-950/50 to-black p-8 text-white shadow-2xl">
                            {/* Close Button */}
                            <button
                                onClick={() => setShowImprovements(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="rounded-full bg-blue-500/20 p-3">
                                    <Lightbulb className="h-8 w-8 text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                                        AI Profile Improvement Tips
                                    </h2>
                                    <p className="text-sm text-zinc-400">Personalized suggestions to boost your profile</p>
                                </div>
                            </div>

                            {/* Loading State */}
                            {improvementLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-400 mb-4" />
                                    <p className="text-zinc-300">Analyzing your profile...</p>
                                    <p className="text-sm text-zinc-500 mt-2">This may take a few seconds</p>
                                </div>
                            ) : suggestions?.error ? (
                                <div className="text-center py-12">
                                    <p className="text-red-400">{suggestions.error}</p>
                                </div>
                            ) : suggestions?.suggestions ? (
                                <div className="space-y-6">
                                    {/* Profile Completeness Score */}
                                    {suggestions.profile_summary && (
                                        <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-5">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-lg font-semibold text-blue-200 flex items-center gap-2">
                                                    <TrendingUp className="h-5 w-5" />
                                                    Profile Completeness
                                                </h3>
                                                <span className="text-2xl font-bold text-blue-300">
                                                    {suggestions.profile_summary.completeness_score}%
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {suggestions.profile_summary.has_resume && (
                                                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm">
                                                        ✓ Resume Uploaded
                                                    </span>
                                                )}
                                                {suggestions.profile_summary.has_bio && (
                                                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm">
                                                        ✓ Bio Added
                                                    </span>
                                                )}
                                                {suggestions.profile_summary.has_education && (
                                                    <span className="px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-300 rounded-full text-sm">
                                                        ✓ Education Complete
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Suggestion Categories */}
                                    <div className="grid grid-cols-1 gap-4">
                                        {suggestions.suggestions.completeness && (
                                            <SuggestionCard
                                                icon={<Target className="h-5 w-5 text-purple-400" />}
                                                title="Profile Completeness"
                                                content={suggestions.suggestions.completeness}
                                            />
                                        )}
                                        {suggestions.suggestions.resume && (
                                            <SuggestionCard
                                                icon={<FileText className="h-5 w-5 text-pink-400" />}
                                                title="Resume Quality"
                                                content={suggestions.suggestions.resume}
                                            />
                                        )}
                                        {suggestions.suggestions.skills && (
                                            <SuggestionCard
                                                icon={<Zap className="h-5 w-5 text-yellow-400" />}
                                                title="Skills & Keywords"
                                                content={suggestions.suggestions.skills}
                                            />
                                        )}
                                        {suggestions.suggestions.bio && (
                                            <SuggestionCard
                                                icon={<Award className="h-5 w-5 text-blue-400" />}
                                                title="Bio/Summary"
                                                content={suggestions.suggestions.bio}
                                            />
                                        )}
                                        {suggestions.suggestions.experience && (
                                            <SuggestionCard
                                                icon={<Building2 className="h-5 w-5 text-cyan-400" />}
                                                title="Experience & Projects"
                                                content={suggestions.suggestions.experience}
                                            />
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="flex justify-center pt-4">
                                        <Button
                                            onClick={() => window.location.href = '/student/profile'}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg flex items-center gap-2"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Go to Profile & Make Changes
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Suggestion Card Component
function SuggestionCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
    return (
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
            <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5">{icon}</div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
            </div>
            <div 
                className="text-sm text-zinc-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        </div>
    );
}
