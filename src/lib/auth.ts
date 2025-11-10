import { getSupabaseServer } from "@/lib/supabaseServer";

export async function getSession() {
  const supabase = await getSupabaseServer();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function requireSession() {
  const user = await getSession();
  if (!user) {
    return null;
  }
  return user;
}
