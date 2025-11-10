// lib/access.ts
import { getCurrentProfile } from "@/lib/current";
import type { UserRole } from "@/lib/profile";
import { redirect } from "next/navigation";

export type Role = UserRole;

/**
 * Returns the current user's role from profile (or null if not logged in)
 */
export async function getRole(): Promise<Role | null> {
    const profile = await getCurrentProfile();
    return (profile?.role as Role) ?? null;
}

/**
 * Returns true if the user has the specified role.
 */
export async function isRole(role: Role): Promise<boolean> {
    const r = await getRole();
    return r === role;
}

/**
 * Checks if user role is one of the allowed ones.
 * Returns `true` if authorized, `false` otherwise.
 */
export async function requireAny(roles: Role[]): Promise<boolean> {
    const r = await getRole();
    if (!r) return false;
    return roles.includes(r);
}

/**
 * Enforce RBAC in server components or routes.
 * Example: await requireRole(["admin"], "/login")
 */
export async function requireRole(roles: Role[], redirectTo = "/"): Promise<void> {
    const allowed = await requireAny(roles);
    if (!allowed) {
        redirect("/forbidden"); // redirects instead of JSON error
    }
}

/**
 * Fallback text message if needed.
 */
export function roleForbiddenText(): string {
    return "403 — Forbidden: You do not have permission to access this section.";
}
