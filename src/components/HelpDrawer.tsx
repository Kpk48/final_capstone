"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  FileText,
  Briefcase,
  GraduationCap,
  BarChart4,
  UserCircle2,
  MessageSquareText,
} from "lucide-react";

type Role = "student" | "company" | "admin" | "guest";

type HelpLink = {
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const helpContent: Record<Role, HelpLink[]> = {
  student: [
    {
      label: "View Applications",
      description: "Check statuses and follow up on applications",
      href: "/student/profile",
      icon: FileText,
    },
    {
      label: "Find Internships",
      description: "Browse curated roles that match your skills",
      href: "/student/browse",
      icon: Briefcase,
    },
    {
      label: "AI Recommendations",
      description: "See internships picked just for you",
      href: "/student/recommendations",
      icon: GraduationCap,
    },
  ],
  company: [
    {
      label: "Company Profile",
      description: "Update your brand and culture details",
      href: "/company/profile",
      icon: UserCircle2,
    },
    {
      label: "Post Internship",
      description: "Create a new role for interns in minutes",
      href: "/company/internships/new",
      icon: Briefcase,
    },
    {
      label: "Review Matches",
      description: "Evaluate AI-ranked student matches",
      href: "/company/matches",
      icon: LifeBuoy,
    },
  ],
  admin: [
    {
      label: "Analytics",
      description: "Monitor platform health and funnels",
      href: "/admin/analytics",
      icon: BarChart4,
    },
    {
      label: "Manage Users",
      description: "Approve companies and oversee accounts",
      href: "/admin/users",
      icon: UserCircle2,
    },
    {
      label: "Data Tools",
      description: "Access RAG tools and embeddings status",
      href: "/admin/tools",
      icon: MessageSquareText,
    },
  ],
  guest: [
    {
      label: "Explore SkillSync",
      description: "See how AI matches talent with internships",
      href: "/",
      icon: LifeBuoy,
    },
    {
      label: "Create an Account",
      description: "Students and companies can join in 2 minutes",
      href: "/register",
      icon: UserCircle2,
    },
    {
      label: "Return to Dashboard",
      description: "Sign in to continue where you left off",
      href: "/dashboard",
      icon: BarChart4,
    },
  ],
};

export default function HelpDrawer() {
  const [role, setRole] = useState<Role>("guest");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/me")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        const fetchedRole = data?.profile?.role as Role | undefined;
        if (fetchedRole && ["student", "company", "admin"].includes(fetchedRole)) {
          setRole(fetchedRole);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      mounted = false;
    };
  }, []);

  const links = useMemo(() => helpContent[role] ?? helpContent.guest, [role]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white shadow-lg shadow-black/40 transition hover:bg-white/10"
        aria-label="Toggle help drawer"
      >
        <LifeBuoy className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed bottom-24 left-6 z-40 w-[320px] origin-bottom-left animate-in fade-in slide-in-from-left-4 rounded-2xl border border-white/10 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-purple-200/70">Need help?</p>
              <h3 className="text-lg font-semibold">Key workflows</h3>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Close help drawer"
            >
              ×
            </button>
          </div>

          <ul className="space-y-3">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-purple-400/40 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <div className="mt-0.5 rounded-lg bg-purple-500/15 p-2 text-purple-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 text-left">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs text-zinc-300/80">{item.description}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-zinc-300/80">
            Pro tip: Ask Carlos to "show me analytics" or "go to my profile" for voice-guided navigation.
          </div>
        </div>
      )}
    </>
  );
}
