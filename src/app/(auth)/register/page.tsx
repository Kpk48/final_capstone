"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { Button, Card, Input, Label } from "@/components/ui";
import Link from "next/link";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [role, setRole] = useState<"student" | "company">("student");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = getSupabaseBrowser();
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role, // "student" | "company"
                    display_name: displayName,
                },
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Setup profile and role-specific records
        try {
            const response = await fetch("/api/auth/setup-profile", {
                method: "POST",
            });

            if (!response.ok) {
                const data = await response.json();
                console.error("Profile setup failed:", data);
                // Continue anyway, profile will be created on next login
            }
        } catch (err) {
            console.error("Profile setup request failed:", err);
            // Continue anyway
        }

        // Redirect based on selected role
        if (role === "student") {
            window.location.href = "/student/profile";
        } else if (role === "company") {
            window.location.href = "/company/profile";
        } else {
            window.location.href = "/dashboard";
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-md border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-8 text-white">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Create your SkillSync Account
                    </h1>
                    <p className="mt-1 text-sm text-zinc-300/80">
                        Join our platform as a Student or Company
                    </p>
                </div>

                <form onSubmit={onRegister} className="space-y-5">
                    <div>
                        <Label className="text-zinc-300">Display Name</Label>
                        <Input
                            required
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g., Alex Johnson or Acme Inc."
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-300">Email</Label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-300">Password</Label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-300 mb-1 block">Role</Label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("student")}
                                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                    role === "student"
                                        ? "border-purple-400 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                                        : "border-white/20 bg-white/5 text-zinc-300 hover:border-white/40"
                                }`}
                            >
                                Student
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("company")}
                                className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                    role === "company"
                                        ? "border-purple-400 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                                        : "border-white/20 bg-white/5 text-zinc-300 hover:border-white/40"
                                }`}
                            >
                                Company
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-rose-500 bg-rose-500/10 rounded-md px-3 py-2 border border-rose-500/20">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20"
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </Button>
                </form>

                <p className="mt-6 text-center text-sm text-zinc-400">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                    >
                        Login
                    </Link>
                </p>
            </Card>
        </div>
    );
}
