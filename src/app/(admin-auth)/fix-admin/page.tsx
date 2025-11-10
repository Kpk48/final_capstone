"use client";
import { useState } from "react";
import { Button, Card, Input, Label } from "@/components/ui";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function FixAdminProfilePage() {
    const [email, setEmail] = useState("");
    const [adminCode, setAdminCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const onFix = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        const res = await fetch("/api/admin/fix-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, adminCode }),
        });

        const json = await res.json();
        setLoading(false);

        if (!res.ok) {
            setMessage({ type: "error", text: json.error || "Failed to fix profile" });
            return;
        }

        setMessage({ type: "success", text: json.message || "Profile fixed successfully!" });
        
        setTimeout(() => {
            window.location.href = "/admin-login";
        }, 2000);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-950 via-black to-black px-6 text-white">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.3),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.25),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-sm border border-white/10 bg-white/10 p-8 backdrop-blur-xl shadow-2xl">
                <div className="mb-6 flex flex-col items-center text-center">
                    <ShieldCheck className="mb-3 h-10 w-10 text-purple-400" />
                    <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Fix Admin Profile
                    </h1>
                    <p className="text-sm text-zinc-400 mt-2">
                        If you registered as admin but can't login, use this to fix your profile.
                    </p>
                </div>

                <form onSubmit={onFix} className="space-y-4">
                    <div>
                        <Label>Admin Email</Label>
                        <Input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@example.com"
                        />
                    </div>
                    <div>
                        <Label>Admin Access Code</Label>
                        <Input
                            type="password"
                            required
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                            placeholder="Enter admin access code"
                        />
                    </div>

                    {message && (
                        <p className={`text-sm text-center px-3 py-2 rounded-md ${
                            message.type === "success" 
                                ? "text-green-400 bg-green-500/10 border border-green-500/20"
                                : "text-red-400 bg-red-500/10 border border-red-500/20"
                        }`}>
                            {message.text}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Fixing...
                            </>
                        ) : (
                            "Fix Admin Profile"
                        )}
                    </Button>
                </form>

                <p className="mt-4 text-center text-xs text-zinc-500">
                    After fixing, you'll be redirected to{" "}
                    <a href="/admin-login" className="text-purple-400 hover:text-pink-400 underline">
                        login
                    </a>
                </p>
            </Card>
        </div>
    );
}
