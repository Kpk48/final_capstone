"use client";
import { Card, Button } from "@/components/ui";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-950 via-black to-black px-6 py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

            <Card className="relative z-10 w-full max-w-md border border-red-500/20 bg-red-500/10 backdrop-blur-2xl shadow-2xl rounded-2xl p-8 text-white">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="p-4 rounded-full bg-red-500/20 border border-red-500/30">
                        <ShieldAlert className="h-12 w-12 text-red-400" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-red-400">
                            403 — Forbidden
                        </h1>
                        <p className="text-sm text-zinc-300/80">
                            You do not have permission to access this section.
                        </p>
                    </div>

                    <p className="text-sm text-zinc-400 leading-relaxed">
                        This page is restricted based on your user role. Please contact an administrator if you believe this is an error.
                    </p>

                    <Link href="/dashboard" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-purple-500/20">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
