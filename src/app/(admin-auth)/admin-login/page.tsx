"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { Button, Card, Input, Label } from "@/components/ui";
import { Shield, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // auto-redirect if already admin
        (async () => {
            const supabase = getSupabaseBrowser();
            const { data } = await supabase.auth.getUser();
            const user = data.user;
            if (!user) return;
            const res = await fetch("/api/me");
            const j = await res.json();
            if (j?.profile?.role === "admin") {
                window.location.href = "/admin/analytics";
            }
        })();
    }, []);

    const onLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const supabase = getSupabaseBrowser();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setError("Invalid credentials");
            setLoading(false);
            return;
        }

        // verify role
        const res = await fetch("/api/me");
        const data = await res.json();

        if (data?.profile?.role !== "admin") {
            setError("Access denied: not an admin");
            await supabase.auth.signOut();
            setLoading(false);
            return;
        }

        window.location.href = "/admin/analytics";
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black px-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.3),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.25),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-sm border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
                <div className="mb-6 flex flex-col items-center text-center">
                    <Shield className="mb-3 h-10 w-10 text-purple-400" />
                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Admin Login
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Access your admin dashboard securely.</p>
                </div>

                <form onSubmit={onLogin} className="space-y-4">
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-center space-y-2">
                            <p className="text-red-400">{error}</p>
                            {error.includes("not an admin") && (
                                <p className="text-xs text-zinc-400">
                                    <a href="/fix-admin" className="text-purple-400 hover:text-pink-400 underline">
                                        Click here to fix your admin profile
                                    </a>
                                </p>
                            )}
                        </div>
                    )}

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Logging in…
                            </>
                        ) : (
                            "Login"
                        )}
                    </Button>
                </form>

                <p className="mt-4 text-center text-xs text-zinc-500">
                    Don't have an admin account?{" "}
                    <a href="/admin-register" className="text-purple-400 hover:text-pink-400 underline">
                        Register here
                    </a>
                </p>
            </Card>
        </div>
    );
}
