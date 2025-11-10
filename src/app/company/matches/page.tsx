"use client";
import { useEffect, useState } from "react";
import { Card, Button } from "@/components/ui";
import { Users2, Briefcase, Loader2, Sparkles, User, X, FileText, GraduationCap, School, Check, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { MessageButton } from "@/components/MessageButton";

type ApplicationStatus = 'applied' | 'under_review' | 'selected' | 'rejected';

export default function CompanyMatchesPage() {
    const [mine, setMine] = useState<{ company: any; internships: any[] } | null>(null);
    const [selected, setSelected] = useState<string | null>(null);
    const [selectedInternship, setSelectedInternship] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
    const [previewApplicant, setPreviewApplicant] = useState<any | null>(null);

    useEffect(() => {
        fetch("/api/company/internships/mine")
            .then((r) => r.json())
            .then((d) => setMine(d));
    }, []);

    const loadMatches = async (internship: any) => {
        setSelected(internship.id);
        setSelectedInternship(internship);
        setPreviewApplicant(null);
        setLoading(true);
        const recs = await fetch(`/api/recommendations/internship?internship_id=${internship.id}`).then((r) =>
            r.json()
        );
        setMatches(recs ?? []);
        setLoading(false);
    };

    const updateApplicationStatus = async (applicationId: string, status: ApplicationStatus) => {
        setUpdatingStatus(prev => ({ ...prev, [applicationId]: true }));
        try {
            const response = await fetch('/api/applications/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId, status })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update status');
            }

            const result = await response.json();

            // Update local state
            setMatches(prev => prev.map(match => {
                if (match.application?.id === applicationId) {
                    return {
                        ...match,
                        application: { ...match.application, status }
                    };
                }
                return match;
            }));

            // Update internship openings
            if (result.openingsDelta && selectedInternship) {
                setSelectedInternship((prev: any) => ({
                    ...prev,
                    openings: prev.openings - result.openingsDelta
                }));
                // Update in mine list too
                setMine((prev: any) => ({
                    ...prev,
                    internships: prev.internships.map((i: any) => 
                        i.id === selectedInternship.id 
                            ? { ...i, openings: i.openings - result.openingsDelta }
                            : i
                    )
                }));
            }

            toast.success(`Application status updated to ${status.replace('_', ' ')}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to update status');
        } finally {
            setUpdatingStatus(prev => ({ ...prev, [applicationId]: false }));
        }
    };

    const getStatusBadge = (status: ApplicationStatus) => {
        const styles: Record<ApplicationStatus, string> = {
            'applied': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
            'under_review': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            'selected': 'bg-green-500/20 text-green-300 border-green-500/30',
            'rejected': 'bg-red-500/20 text-red-300 border-red-500/30'
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
                {status === 'selected' && <Check className="w-3 h-3" />}
                {status === 'under_review' && <Clock className="w-3 h-3" />}
                {status === 'rejected' && <XCircle className="w-3 h-3" />}
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="relative min-h-screen text-white">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.2),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.15),transparent_70%)]" />

            <div className="page-shell max-w-6xl">
                <section className="page-hero text-center">
                    <h1 className="page-title">Matched Applicants</h1>
                    <p className="page-subtitle mt-3">
                        Only students who have applied for your internships appear here, ranked by AI fit score.
                    </p>
                </section>

                {!mine ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        <p className="ml-3 text-zinc-400 text-sm">Loading your internships…</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        {/* Left Panel — Your Internships */}
                        <Card className="section-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-purple-400" />
                                    <h2 className="text-lg font-semibold">Your Internships</h2>
                                </div>
                                {selectedInternship && (
                                    <div className="text-sm bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
                                        <span className="text-purple-200">Seats: </span>
                                        <span className="font-semibold text-white">{selectedInternship.openings}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {mine.internships?.length ? (
                                    mine.internships.map((i) => (
                                        <button
                                            key={i.id}
                                            onClick={() => loadMatches(i)}
                                            className={`text-left rounded-xl border px-4 py-3 transition-all duration-200 ${
                                                selected === i.id
                                                    ? "border-purple-400/50 bg-gradient-to-r from-purple-600/20 to-pink-600/20 shadow-lg"
                                                    : "border-white/10 bg-white/5 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-medium text-white">{i.title}</span>
                                                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                                                    {i.openings} seat{i.openings !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-400 mt-1">
                                                {new Date(i.created_at).toLocaleDateString("en-IN", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-sm text-zinc-400">
                                        No internships posted yet.
                                    </p>
                                )}
                            </div>
                        </Card>

                        {/* Right Panel — Matches */}
                        <Card className="section-card">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Users2 className="h-5 w-5 text-pink-400" />
                                    <h2 className="text-lg font-semibold">Recommendations</h2>
                                </div>
                                {loading && (
                                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading…
                                    </div>
                                )}
                            </div>

                            {/* Matches List */}
                            <div className="flex flex-col gap-3">
                                {matches.map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setPreviewApplicant(m)}
                                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-md transition hover:-translate-y-0.5 hover:border-purple-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/40"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 rounded-full bg-white text-zinc-900">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">
                                                            {m.profile?.display_name || m.profile?.email}
                                                        </div>
                                                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                                                            <span>Applied {m.application?.created_at ? new Date(m.application.created_at).toLocaleDateString("en-IN", {
                                                                year: "numeric",
                                                                month: "short",
                                                                day: "numeric",
                                                            }) : "recently"}</span>
                                                            {m.application?.status && getStatusBadge(m.application.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                                {m.profile?.id && (
                                                    <MessageButton
                                                        recipientProfileId={m.profile.id}
                                                        recipientName={m.profile.display_name || "Student"}
                                                        applicationId={m.application?.id}
                                                        variant="icon"
                                                    />
                                                )}
                                            </div>
                                            <div
                                                className={`text-xs font-semibold ${
                                                    m.score > 0.8
                                                        ? "text-green-400"
                                                        : m.score > 0.5
                                                            ? "text-yellow-400"
                                                            : "text-red-400"
                                                }`}
                                            >
                                                Match {(m.score * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </button>
                                ))}

                                {/* Empty states */}
                                {!loading && selected && matches.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-white/20 bg-white/5 py-6 text-center text-sm text-zinc-400">
                                        No applicants yet. Encourage students to apply or share this internship link.
                                    </div>
                                )}

                                {!selected && (
                                    <div className="flex flex-col items-center text-zinc-400 py-6">
                                        <Sparkles className="h-6 w-6 mb-2 text-purple-400" />
                                        <p className="text-sm">Select an internship to view matched students.</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {previewApplicant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setPreviewApplicant(null)}
                    />
                    <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-black/90 p-6 text-white shadow-2xl backdrop-blur-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-purple-200/70">Applicant profile</p>
                                <h3 className="text-xl font-semibold">
                                    {previewApplicant.profile?.display_name || previewApplicant.profile?.email || "Candidate"}
                                </h3>
                                <p className="text-xs text-zinc-400 mt-1">
                                    Matched {previewApplicant.application?.created_at ? new Date(previewApplicant.application.created_at).toLocaleDateString("en-IN", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                    }) : "recently"} • Score {(previewApplicant.score * 100).toFixed(0)}%
                                </p>
                                {previewApplicant.application?.status && (
                                    <p className="text-xs text-zinc-400">Application status: {previewApplicant.application.status}</p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewApplicant(null)}
                                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close applicant profile"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-purple-200">
                                    <GraduationCap className="h-4 w-4" />
                                    <span>Education</span>
                                </div>
                                <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
                                    <p className="font-medium flex items-center gap-2">
                                        <School className="h-4 w-4 text-purple-300" />
                                        {previewApplicant.university || "University not provided"}
                                    </p>
                                    <p className="mt-1 text-zinc-300/80">
                                        {previewApplicant.degree || "Degree not provided"}
                                        {previewApplicant.graduation_year ? ` • Class of ${previewApplicant.graduation_year}` : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-purple-200">
                                    <FileText className="h-4 w-4" />
                                    <span>Resume extract</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
                                    <p className="whitespace-pre-wrap leading-relaxed">
                                        {previewApplicant.resume_text || "No resume text available."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {previewApplicant.application && (
                            <div className="mt-6 border-t border-white/10 pt-6">
                                <h4 className="text-sm font-medium text-purple-200 mb-3">Update Application Status</h4>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => updateApplicationStatus(previewApplicant.application.id, 'under_review')}
                                        disabled={updatingStatus[previewApplicant.application.id] || previewApplicant.application.status === 'under_review'}
                                        className="flex-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Clock className="w-4 h-4" />
                                        Under Review
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateApplicationStatus(previewApplicant.application.id, 'selected')}
                                        disabled={updatingStatus[previewApplicant.application.id] || previewApplicant.application.status === 'selected' || (selectedInternship?.openings <= 0 && previewApplicant.application.status !== 'selected')}
                                        className="flex-1 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-300 transition hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" />
                                        Select
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateApplicationStatus(previewApplicant.application.id, 'rejected')}
                                        disabled={updatingStatus[previewApplicant.application.id] || previewApplicant.application.status === 'rejected'}
                                        className="flex-1 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex justify-between items-center gap-3">
                            {previewApplicant.profile?.id && (
                                <MessageButton
                                    recipientProfileId={previewApplicant.profile.id}
                                    recipientName={previewApplicant.profile.display_name || "Student"}
                                    applicationId={previewApplicant.application?.id}
                                    variant="outline"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => setPreviewApplicant(null)}
                                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white transition hover:bg-white/10"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
