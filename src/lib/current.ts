// lib/current.ts
import { getSupabaseServer } from "@/lib/supabaseServer";
import { ensureProfile } from "@/lib/profile";

export async function getCurrentProfile() {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to read existing profile
    const { data, error } = await supabase
        .from("profiles")
        .select("id, role, display_name, email, auth_user_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();

    if (error) throw error;

    if (data) return data;

    // If not present yet, create it using metadata hints
    const roleHint = user.user_metadata?.role;
    const displayNameHint = user.user_metadata?.display_name;
    const created = await ensureProfile(roleHint, displayNameHint);
    return created;
}
