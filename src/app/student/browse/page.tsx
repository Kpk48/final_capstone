"use client";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/ui";
import { Briefcase, MapPin, Laptop, Loader2, Building2, Sparkles, Bell, BellOff, Users, Check } from "lucide-react";
import { MessageButton } from "@/components/MessageButton";

export default function BrowseInternshipsPage() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState<string | null>(null);
    const [following, setFollowing] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        loadInternships();
    }, []);

    const loadInternships = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/internships/list");
            const data = await res.json();
            setItems(data ?? []);
        } catch (error) {
            console.error("Failed to load internships:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollowCompany = async (companyId: string, isCurrentlyFollowing: boolean) => {
        setFollowing(companyId);
        try {
            const endpoint = "/api/companies/follow";
            const method = isCurrentlyFollowing ? "DELETE" : "POST";
            const url = isCurrentlyFollowing ? `${endpoint}?companyId=${companyId}` : endpoint;
            const body = isCurrentlyFollowing ? undefined : JSON.stringify({ companyId });
            
            const res = await fetch(url, {
                method,
                headers: body ? { "Content-Type": "application/json" } : {},
                body
            });
            
            if (res.ok) {
                // Reload to update following status and counts
                await loadInternships();
            }
        } catch (error) {
            console.error("Follow toggle failed:", error);
        } finally {
            setFollowing(null);
        }
    };

    const apply = async (id: string) => {
        setApplying(id);
        setMessage(null);
        
        try {
            const res = await fetch("/api/applications/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ internship_id: id }),
            });
            
            let json;
            try {
                json = await res.json();
            } catch (parseError) {
                console.error("Failed to parse response:", parseError);
                setMessage("❌ Server error. Please try again.");
                setApplying(null);
                return;
            }
            
            if (!res.ok) {
                // Handle specific error types
                if (json.error === "resume_required") {
                    setMessage("❌ Resume required! Please upload your resume in your profile before applying.");
                } else if (json.error === "already_applied") {
                    setMessage("⚠️ " + (json.message || "You have already applied to this internship."));
                } else if (json.error === "student not found") {
                    setMessage("❌ Student profile not found. Please logout and login again to fix this.");
                } else {
                    setMessage("❌ " + (json.message || json.error || "Failed to apply. Please try again."));
                }
                console.error("Application error:", json);
            } else {
                setMessage("✅ Applied successfully!");
                // Optionally reload the list to update the UI
                setTimeout(() => setMessage(null), 5000);
            }
        } catch (error) {
            console.error("Apply request failed:", error);
            setMessage("❌ Network error. Please check your connection and try again.");
        } finally {
            setApplying(null);
        }
    };

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12 text-white">
            {/* Soft gradient lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

            <div className="relative z-10 mx-auto w-full max-w-6xl space-y-10">
                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                        Browse Internships
                    </h1>
                    <p className="text-sm text-zinc-400">
                        Explore active internship opportunities and apply directly to your preferred companies.
                    </p>
                </div>

                {/* Message */}
                {message && (
                    <div
                        className={`text-sm px-4 py-3 rounded-lg border ${
                            message.includes("✅")
                                ? "text-green-400 bg-green-500/10 border-green-500/20"
                                : "text-red-400 bg-red-500/10 border-red-500/20"
                        }`}
                    >
                        {message}
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center h-48 text-zinc-400">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        <span className="ml-3 text-sm">Loading internships...</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-zinc-400">
                        <Sparkles className="h-6 w-6 text-purple-400 mb-2" />
                        <p>No internships found. Check back later!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {items.map((i) => (
                            <Card
                                key={i.id}
                                className="rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-6 shadow-2xl transition-transform hover:-translate-y-1 hover:border-purple-400/40"
                            >
                                {/* Internship Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-white">{i.title}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                                <Building2 className="h-4 w-4 text-purple-400" />
                                                {i.company?.name ?? "Unknown Company"}
                                            </div>
                                            {i.company && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => toggleFollowCompany(i.company.id, i.company.is_following)}
                                                        disabled={following === i.company.id}
                                                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                                                            i.company.is_following
                                                                ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
                                                                : "bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30"
                                                        }`}
                                                    >
                                                        {following === i.company.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : i.company.is_following ? (
                                                            <>
                                                                <Check className="h-3 w-3" />
                                                                Following
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Bell className="h-3 w-3" />
                                                                Follow
                                                            </>
                                                        )}
                                                    </button>
                                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {i.company.follower_count}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {i.company?.profile_id && (
                                            <MessageButton
                                                recipientProfileId={i.company.profile_id}
                                                recipientName={i.company.name}
                                                variant="icon"
                                            />
                                        )}
                                        <Button
                                            onClick={() => apply(i.id)}
                                            disabled={applying === i.id}
                                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md shadow-purple-500/30"
                                        >
                                            {applying === i.id ? "Applying..." : "Apply"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Topics */}
                                {i.topics && i.topics.length > 0 && (
                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {i.topics.map((topic: any) => (
                                            <span
                                                key={topic.id}
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                                                    topic.category === 'programming_language'
                                                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                                        : topic.category === 'framework'
                                                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                                }`}
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                {topic.name}
                                                {topic.relevance_score && topic.relevance_score > 0.8 && (
                                                    <span className="text-xs opacity-70">⭐</span>
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Description */}
                                <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                                    {i.description}
                                </p>

                                {/* Details */}
                                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300">
                    {i.is_remote ? (
                        <>
                            <Laptop className="h-3 w-3 text-purple-400" />
                            Remote
                        </>
                    ) : (
                        <>
                            <MapPin className="h-3 w-3 text-pink-400" />
                            {i.location || "Onsite"}
                        </>
                    )}
                  </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-zinc-300">
                    <Briefcase className="h-3 w-3 text-purple-400" />
                    Openings: {i.openings ?? 1}
                  </span>
                                    {i.stipend && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-green-500/20 bg-green-500/10 text-green-300 font-semibold">
                                            💰 ₹{i.stipend.toLocaleString()}/month
                                        </span>
                                    )}
                                    {!i.stipend && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-zinc-500/20 bg-zinc-500/10 text-zinc-400">
                                            Unpaid
                                        </span>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
