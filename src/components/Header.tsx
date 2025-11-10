"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import { Button } from "@/components/ui";
import { NotificationBell } from "@/components/NotificationBell";
import {
  User2,
  Briefcase,
  Shield,
  LayoutDashboard,
  GraduationCap,
  Building2,
  BarChart4,
  Menu,
  X,
  FileText,
  Search,
  MessageSquare,
  Users,
  Bell,
  MoreHorizontal,
} from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const defaultLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/browse", label: "Explore", icon: GraduationCap },
  { href: "/company/profile", label: "Companies", icon: Building2 },
];

const roleLinks: Record<string, NavLink[]> = {
  student: [
    { href: "/student/profile", label: "Profile", icon: User2 },
    { href: "/student/browse", label: "Browse", icon: Briefcase },
    { href: "/student/recommendations", label: "AI Recs", icon: Shield },
    { href: "/student/applications", label: "Applications", icon: FileText },
    { href: "/student/following", label: "Following", icon: Bell },
    { href: "/search", label: "Search", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ],
  company: [
    { href: "/company/profile", label: "Company", icon: Building2 },
    { href: "/company/internships/new", label: "Post", icon: LayoutDashboard },
    { href: "/company/matches", label: "Matches", icon: BarChart4 },
    { href: "/search", label: "Search", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ],
  admin: [
    { href: "/admin/analytics", label: "Analytics", icon: BarChart4 },
    { href: "/admin/users", label: "Users", icon: User2 },
    { href: "/admin/data", label: "Data", icon: Briefcase },
    { href: "/admin/tools", label: "RAG Tools", icon: Shield },
    { href: "/search", label: "Search", icon: Search },
    { href: "/messages", label: "Messages", icon: MessageSquare },
  ],
};

export default function Header() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);

  useEffect(() => {
    const s = getSupabaseBrowser();
    s.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      setUserEmail(user?.email ?? null);
      if (user) {
        const res = await fetch("/api/me").then((r) => r.json());
        setRole(res?.profile?.role ?? null);
      }
      setRoleLoading(false);
    });
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
    if (isOverflowOpen) {
      setIsOverflowOpen(false);
    }
  }, [pathname]);

  const links = useMemo<NavLink[]>(() => {
    if (role && roleLinks[role]) {
      return roleLinks[role];
    }
    return defaultLinks;
  }, [role]);

  const logout = async () => {
    const s = getSupabaseBrowser();
    await s.auth.signOut();
    window.location.href = "/";
  };

  // Map hrefs to tour attribute names
  const getTourAttribute = (href: string): string | undefined => {
    const tourMap: Record<string, string> = {
      "/student/profile": "student-profile",
      "/student/browse": "student-browse",
      "/student/recommendations": "student-recommendations",
      "/student/applications": "student-applications",
      "/student/following": "student-following",
      "/company/profile": "company-profile",
      "/company/internships/new": "company-post",
      "/company/matches": "company-matches",
      "/admin/analytics": "admin-analytics",
      "/admin/users": "admin-users",
      "/admin/data": "admin-data",
      "/admin/tools": "admin-tools",
      "/search": "search",
      "/dashboard": "dashboard",
      "/messages": "messages",
    };
    return tourMap[href];
  };

  const renderLinks = (variant: "desktop" | "mobile") => {
    const primaryLinks =
      variant === "desktop" ? links.slice(0, 4) : links;
    const overflowLinks =
      variant === "desktop" ? links.slice(4) : [];

    return (
      <ul
        className={`flex ${
          variant === "desktop"
            ? "items-center gap-2"
            : "flex-col gap-2"
        }`}
      >
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          const tourAttr = getTourAttribute(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                data-tour={tourAttr}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-purple-500/20 text-white shadow-sm shadow-purple-500/40"
                    : "text-zinc-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-purple-300" : "text-purple-400"}`} />
                {link.label}
              </Link>
            </li>
          );
        })}
        {variant === "desktop" && overflowLinks.length > 0 && (
          <li className="relative">
            <button
              onClick={() => setIsOverflowOpen((prev) => !prev)}
              data-tour="nav-overflow"
              aria-expanded={isOverflowOpen}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                isOverflowOpen
                  ? "bg-purple-500/20 text-white shadow-sm shadow-purple-500/40"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
            >
              <MoreHorizontal className="h-4 w-4 text-purple-400" />
              More
            </button>
            {isOverflowOpen && (
              <div className="absolute right-0 z-50 mt-3 w-52 rounded-xl border border-white/10 bg-black/90 p-2 shadow-lg backdrop-blur-xl">
                <ul className="flex flex-col gap-1">
                  {overflowLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname.startsWith(link.href);
                    const tourAttr = getTourAttribute(link.href);
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          data-tour={tourAttr}
                          onClick={() => setIsOverflowOpen(false)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                            isActive
                              ? "bg-purple-500/20 text-white"
                              : "text-zinc-300 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          <Icon className={`h-4 w-4 ${isActive ? "text-purple-300" : "text-purple-400"}`} />
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </li>
        )}
      </ul>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/50 md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href="/"
            className="text-lg font-semibold bg-gradient-to-r from-purple-300 to-fuchsia-500 bg-clip-text text-transparent transition hover:opacity-90"
          >
            SkillSync
          </Link>

          {!roleLoading && role && (
            <span className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-purple-200 md:flex">
              {role}
            </span>
          )}
        </div>

        <nav className="hidden items-center gap-4 md:flex">
          {renderLinks("desktop")}
          {userEmail && <NotificationBell />}
          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">{userEmail}</span>
              <Button
                onClick={logout}
                className="h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 text-xs font-medium hover:from-purple-600 hover:to-pink-700"
              >
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-3 py-2 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-700"
              >
                Join SkillSync
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-white/10 bg-black/80 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4">
            {renderLinks("mobile")}
            {userEmail ? (
              <div className="flex flex-col gap-2 text-sm text-zinc-300">
                <span className="text-xs text-zinc-500">Signed in as</span>
                <span className="rounded-xl bg-white/5 px-3 py-2">{userEmail}</span>
                <Button
                  onClick={logout}
                  className="mt-2 h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-4 text-xs font-medium hover:from-purple-600 hover:to-pink-700"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="rounded-xl bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 px-3 py-2 text-center text-sm font-medium"
                >
                  Join SkillSync
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
    </header>
  );
}
