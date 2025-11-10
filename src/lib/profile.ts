import { getSupabaseServer } from "@/lib/supabaseServer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type UserRole = "student" | "company" | "admin";

export async function ensureProfile(roleHint?: UserRole, displayNameHint?: string) {
    const server = await getSupabaseServer();
    const { data: userResp } = await server.auth.getUser();
    const user = userResp.user;
    if (!user) return null;

    const admin = getSupabaseAdmin();

    // Read metadata hints (from RegisterPage)
    const metaRole = (user.user_metadata?.role as UserRole | undefined) ?? roleHint;
    const metaDisplayName = (user.user_metadata?.display_name as string | undefined) ?? displayNameHint;

    // 1) Try to load existing profile by auth_user_id
    const { data: existing, error: selErr } = await admin
        .from("profiles")
        .select("id, role, display_name, email, auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (selErr) throw selErr;

    // 2) If exists but role/display_name missing, patch it from metadata
    if (existing) {
        const updates: Record<string, any> = {};
        if (!existing.role && metaRole) updates.role = metaRole;
        if (!existing.display_name && metaDisplayName) updates.display_name = metaDisplayName;
        if (!existing.email && user.email) updates.email = user.email;

        if (Object.keys(updates).length > 0) {
            const { data: patched, error: upErr } = await admin
                .from("profiles")
                .update(updates)
                .eq("id", existing.id)
                .select("id, role, display_name, email, auth_user_id")
                .single();
            if (upErr) throw upErr;
            return patched;
        }
        return existing;
    }

    // 3) Create a new profile with correct role/display_name
    const role: UserRole = metaRole ?? "student"; // default only if no hint provided
    const email = user.email ?? "";

    const { data: prof, error: insErr } = await admin
        .from("profiles")
        .insert({
            auth_user_id: user.id,
            email,
            role,
            display_name: metaDisplayName ?? email,
        })
        .select("id, role, display_name, email, auth_user_id")
        .single();
    if (insErr) throw insErr;

    // 4) (Optional) Seed role-specific tables
    if (role === "student") {
        await admin.from("students").insert({ profile_id: prof.id }).throwOnError();
    } else if (role === "company") {
        await admin
            .from("companies")
            .insert({ profile_id: prof.id, name: prof.display_name || email })
            .throwOnError();
    }

    return prof;
}