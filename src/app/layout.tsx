import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Carlos from "@/components/Carlos";
import HelpDrawer from "@/components/HelpDrawer";
import TutorialProvider from "@/components/TutorialProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "SkillSync — Intelligent Internship Matching",
    description: "Students and companies matched by AI using RAG and Supabase",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        >
        {/* Global Gradient Background */}
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-purple-950 via-black to-black" />
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.25),transparent_60%),radial-gradient(circle_at_bottom_right,rgba(219,39,119,0.2),transparent_70%)]" />

        {/* Header */}
        <Header />

        {/* Main Content Area */}
        <main className="relative z-10 mx-auto min-h-[calc(100vh-56px)] w-full max-w-7xl px-6 py-12">
            {children}
        </main>

        {/* Optional global footer */}
        <footer className="relative z-10 border-t border-white/10 mt-10 py-6 text-center text-sm text-zinc-500">
            © {new Date().getFullYear()} SkillSync — AI-Powered Internship Matching
        </footer>

        {/* Global assistants */}
        <Carlos />
        <HelpDrawer />
        <TutorialProvider />
        <Toaster position="top-right" richColors />
        </body>
        </html>
    );
}
