"use client";
import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ShieldPlus, Loader2, KeyRound } from "lucide-react";

export default function AdminRegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [adminCode, setAdminCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const res = await fetch("/api/admin/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, displayName, adminCode }),
        });


        const json = await res.json();
        setLoading(false);

        if (!res.ok) {
            setError(json.error || "Failed to register admin");
            return;
        }

        setSuccess("Admin account created! Redirecting...");
        setTimeout(() => (window.location.href = "/admin-login"), 1500);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black px-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.3),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.25),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-sm border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
                <div className="mb-6 flex flex-col items-center text-center">
                    <ShieldPlus className="mb-3 h-10 w-10 text-purple-400" />
                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Admin Registration
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1">Create a secure administrator account.</p>
                </div>

                <form onSubmit={onRegister} className="space-y-4">
                    <div>
                        <Label>Display Name</Label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="e.g., Praveen (Admin)"
                            required
                        />
                    </div>
                    <div>
                        <Label>Email</Label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div>
                        <Label>Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <Label>
              <span className="inline-flex items-center gap-1">
                <KeyRound className="h-4 w-4 text-purple-400" />
                Admin Access Code
              </span>
                        </Label>
                        <Input
                            type="password"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            placeholder="Enter admin access code"
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    {success && <p className="text-sm text-emerald-400 text-center">{success}</p>}

                    <Button
                        type="submit"
                        loading={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Registering…
                            </>
                        ) : (
                            "Register"
                        )}
                    </Button>
                </form>

                <p className="mt-4 text-center text-xs text-zinc-500">
                    Already have an account?{" "}
                    <a href="/admin-login" className="text-purple-400 hover:text-pink-400 underline">
                        Login
                    </a>
                </p>
            </Card>
        </div>
    );
}
