import { getSupabaseAdmin } from "./supabaseAdmin";

/**
 * Generates a unique username in the format: user_xxxxx
 * where xxxxx is a random 5-character alphanumeric string
 */
export async function generateUniqueUsername(): Promise<string> {
  const admin = getSupabaseAdmin();
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random 5-character string
    const randomStr = Math.random().toString(36).substring(2, 7).toLowerCase();
    const username = `user_${randomStr}`;

    // Check if username exists
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (!data) {
      // Username is available
      return username;
    }
  }

  // Fallback: use timestamp
  return `user_${Date.now().toString(36)}`;
}
