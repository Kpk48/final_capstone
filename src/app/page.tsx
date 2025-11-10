import Link from "next/link";
import { Briefcase, GraduationCap, Shield } from "lucide-react";

export default function Home() {
    return (
        <div className="relative min-h-screen text-white">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <div className="page-shell text-center">
                {/* HERO SECTION */}
                <section className="page-hero relative overflow-hidden">
                    <div className="pointer-events-none absolute -top-32 -right-24 h-64 w-64 rounded-full bg-purple-500/30 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

                    <h1 className="page-title mb-4 leading-tight">
                        SkillSync
                    </h1>
                    <p className="page-subtitle mx-auto mb-10 max-w-2xl">
                        Empowering students and companies through intelligent internship matching. Built with <span className="text-purple-300 font-medium">AI, RAG</span>, and{" "}
                        <span className="text-pink-300 font-medium">Supabase</span> — delivering smarter opportunities for every profile.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link
                            href="/register"
                            className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-sm font-medium text-white shadow-md transition hover:from-purple-600 hover:to-pink-600"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/dashboard"
                            className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-200 backdrop-blur transition hover:bg-white/10"
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </section>

                {/* FEATURE SECTION */}
                <section className="section-grid">
                    <Link
                        href="/register"
                        className="group section-card relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 opacity-0 transition group-hover:opacity-100" />
                        <div className="relative z-10 text-left">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-600/10 p-3 text-purple-300 shadow">
                                <GraduationCap className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">Students</h3>
                            <p className="text-sm leading-relaxed text-zinc-300/90">
                                Build your profile, upload resumes, and receive AI-curated internship recommendations tailored to your unique skill set.
                            </p>
                            <p className="mt-4 inline-block text-sm font-medium text-purple-300 transition group-hover:text-pink-300">
                                Go to Student registration →
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/register"
                        className="group section-card relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 opacity-0 transition group-hover:opacity-100" />
                        <div className="relative z-10 text-left">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-600/10 p-3 text-purple-300 shadow">
                                <Briefcase className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">Companies</h3>
                            <p className="text-sm leading-relaxed text-zinc-300/90">
                                Post internships and instantly discover students who match your needs using SkillSync’s AI-powered ranking and recommendation system.
                            </p>
                            <p className="mt-4 inline-block text-sm font-medium text-purple-300 transition group-hover:text-pink-300">
                                Go to Company registration →
                            </p>
                        </div>
                    </Link>

                    <Link
                        href="/admin-login"
                        className="group section-card relative"
                    >
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-600/10 via-transparent to-pink-600/10 opacity-0 transition group-hover:opacity-100" />
                        <div className="relative z-10 text-left">
                            <div className="mb-4 inline-flex rounded-xl bg-purple-600/10 p-3 text-purple-300 shadow">
                                <Shield className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold">Admin</h3>
                            <p className="text-sm leading-relaxed text-zinc-300/90">
                                Oversee user engagement, monitor analytics, and maintain high-quality matches between students and companies.
                            </p>
                            <p className="mt-4 inline-block text-sm font-medium text-purple-300 transition group-hover:text-pink-300">
                                Go to Admin Login →
                            </p>
                        </div>
                    </Link>
                </section>
            </div>
        </div>
    );
}
