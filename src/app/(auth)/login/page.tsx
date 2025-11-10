"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { Button, Card, Input, Label } from "@/components/ui";
import Link from "next/link";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const supabase = getSupabaseBrowser();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        // Ensure profile and role records exist (fixes any missing records)
        try {
            await fetch("/api/auth/setup-profile", { method: "POST" });
        } catch (err) {
            console.error("Profile setup check failed:", err);
        }

        // Fetch user role and redirect to appropriate page
        const res = await fetch("/api/me");
        const data = await res.json();
        const role = data?.profile?.role;

        if (role === "student") {
            window.location.href = "/student/profile";
        } else if (role === "company") {
            window.location.href = "/company/profile";
        } else if (role === "admin") {
            window.location.href = "/admin/analytics";
        } else {
            window.location.href = "/dashboard";
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-sm border border-white/10 bg-white/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-8 text-white">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">SkillSync Login</h1>
                    <p className="mt-1 text-sm text-zinc-300/80">
                        Welcome back! Please sign in to continue.
                    </p>
                </div>

                <form onSubmit={onLogin} className="space-y-5">
                    <div>
                        <Label className="text-zinc-300">Email</Label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <Label className="text-zinc-300">Password</Label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 bg-white/10 border-white/20 text-white placeholder-zinc-400 focus:border-purple-400 focus:ring-purple-400"
                            placeholder="••••••••"
                        />
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
                        {loading ? "Signing in..." : "Login"}
                    </Button>
                </form>

                <div className="mt-6 space-y-2 text-center text-sm text-zinc-400">
                    <p>
                        Forgot your password?{" "}
                        <Link
                            href="/forgot-password"
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                        >
                            Reset it
                        </Link>
                    </p>
                    <p>
                        No account?{" "}
                        <Link
                            href="/register"
                            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                        >
                            Register
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}
