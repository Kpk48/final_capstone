"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { User2, Building2, Globe2, Loader2, Eye, EyeOff, Briefcase, Calendar, GraduationCap, School, FileText, Download, MapPin, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export default function PublicProfilePage() {
    const params = useParams();
    const router = useRouter();
    const username = params.username as string;

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (username) {
            loadProfile();
        }
    }, [username]);

    const loadProfile = async () => {
        try {
            const response = await fetch(`/api/public/profile/${username}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    setError("Profile not found");
                } else {
                    setError("Failed to load profile");
                }
                return;
            }

            const data = await response.json();
            setProfile(data);
        } catch (err) {
            setError("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleApply = (internshipId: string) => {
        router.push(`/student/browse?internship=${internshipId}`);
    };

    if (loading) {
        return (
            <div className="relative min-h-screen text-white flex items-center justify-center">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
                <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="relative min-h-screen text-white">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
                <div className="page-shell max-w-3xl">
                    <Card className="section-card text-center py-12">
                        <h2 className="text-2xl font-bold text-red-400 mb-2">{error}</h2>
                        <p className="text-zinc-400 mb-6">The profile you're looking for doesn't exist.</p>
                        <Link href="/search">
                            <Button className="bg-purple-500 hover:bg-purple-600">
                                Go to Search
                            </Button>
                        </Link>
                    </Card>
                </div>
            </div>
        );
    }

    const isStudent = profile.role === "student";
    const isCompany = profile.role === "company";
    const isVisible = isCompany || profile.is_public;

    return (
        <div className="relative min-h-screen text-white">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <div className="page-shell max-w-4xl">
                {/* Header */}
                <div className="page-hero">
                    <div className="flex items-center gap-3 justify-center mb-4">
                        {isStudent && <User2 className="h-8 w-8 text-purple-400" />}
                        {isCompany && <Building2 className="h-8 w-8 text-pink-400" />}
                        <h1 className="page-title">
                            {profile.display_name || `@${profile.username}`}
                        </h1>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-zinc-300">
                        <code className="text-purple-300 font-mono">@{profile.username}</code>
                        {isVisible ? (
                            <Eye className="h-4 w-4 text-blue-400" />
                        ) : (
                            <EyeOff className="h-4 w-4 text-zinc-500" />
                        )}
                    </div>
                </div>

                {/* Student Profile */}
                {isStudent && (
                    <Card className="section-card space-y-6">
                        {!isVisible ? (
                            <div className="text-center py-12">
                                <EyeOff className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-zinc-300 mb-2">
                                    This Profile is Private
                                </h3>
                                <p className="text-zinc-500">
                                    This user has chosen to keep their profile private.
                                </p>
                            </div>
                        ) : profile.student && (
                            <>
                                {profile.student.bio && (
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
                                            <FileText className="h-4 w-4 text-purple-400" />
                                            About
                                        </h3>
                                        <p className="text-white bg-white/5 border border-white/10 rounded-lg p-4">
                                            {profile.student.bio}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {profile.student.university && (
                                        <div>
                                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                                                <School className="h-4 w-4 text-pink-400" />
                                                University
                                            </h3>
                                            <p className="text-white">{profile.student.university}</p>
                                        </div>
                                    )}

                                    {profile.student.degree && (
                                        <div>
                                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                                                <GraduationCap className="h-4 w-4 text-purple-400" />
                                                Degree
                                            </h3>
                                            <p className="text-white">{profile.student.degree}</p>
                                        </div>
                                    )}

                                    {profile.student.graduation_year && (
                                        <div>
                                            <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4 text-pink-400" />
                                                Graduation Year
                                            </h3>
                                            <p className="text-white">{profile.student.graduation_year}</p>
                                        </div>
                                    )}
                                </div>

                                {profile.student.resume_url && (
                                    <div>
                                        <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2 mb-3">
                                            <FileText className="h-4 w-4 text-purple-400" />
                                            Resume
                                        </h3>
                                        <a
                                            href={profile.student.resume_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 rounded-lg transition"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download Resume
                                        </a>
                                    </div>
                                )}
                            </>
                        )}
                    </Card>
                )}

                {/* Company Profile */}
                {isCompany && profile.company && (
                    <div className="space-y-6">
                        <Card className="section-card space-y-6">
                            {profile.company.logo_url && (
                                <div className="flex justify-center">
                                    <img 
                                        src={profile.company.logo_url} 
                                        alt={profile.company.name}
                                        className="h-24 object-contain"
                                    />
                                </div>
                            )}

                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    {profile.company.name}
                                </h2>
                                {profile.company.website && (
                                    <a
                                        href={profile.company.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition"
                                    >
                                        <Globe2 className="h-4 w-4" />
                                        {profile.company.website}
                                    </a>
                                )}
                            </div>

                            {profile.company.description && (
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-300 mb-3">About Company</h3>
                                    <p className="text-white whitespace-pre-wrap bg-white/5 border border-white/10 rounded-lg p-4">
                                        {profile.company.description}
                                    </p>
                                </div>
                            )}
                        </Card>

                        {/* Company Internships */}
                        {profile.internships && profile.internships.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Briefcase className="h-6 w-6 text-purple-400" />
                                    Open Positions ({profile.internships.length})
                                </h2>
                                <div className="space-y-4">
                                    {profile.internships.map((internship: any) => (
                                        <Card key={internship.id} className="section-card">
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-xl font-semibold text-white mb-1">
                                                        {internship.title}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                                                        {internship.location && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3.5 w-3.5" />
                                                                {internship.location}
                                                            </span>
                                                        )}
                                                        {internship.stipend && (
                                                            <span className="flex items-center gap-1">
                                                                <DollarSign className="h-3.5 w-3.5" />
                                                                ₹{internship.stipend}/month
                                                            </span>
                                                        )}
                                                        {internship.duration && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {internship.duration}
                                                            </span>
                                                        )}
                                                        {internship.openings && (
                                                            <span className="text-green-400">
                                                                {internship.openings} openings
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    onClick={() => handleApply(internship.id)}
                                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 flex-shrink-0"
                                                >
                                                    Apply
                                                </Button>
                                            </div>

                                            {internship.description && (
                                                <p className="text-zinc-300 mb-4 line-clamp-3">
                                                    {internship.description}
                                                </p>
                                            )}

                                            {internship.skills && internship.skills.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {internship.skills.map((skill: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-full text-sm"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
