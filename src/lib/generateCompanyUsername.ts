import { getSupabaseAdmin } from "./supabaseAdmin";

/**
 * Generates a unique username based on company name
 * Examples:
 * - "Google" -> "google"
 * - "Google" (2nd) -> "google_1"
 * - "Google LLC" -> "google_llc"
 * - "Acme Corp." -> "acme_corp"
 */
export async function generateCompanyUsername(companyName: string): Promise<string> {
  const admin = getSupabaseAdmin();
  
  // Sanitize company name to create base username
  const baseUsername = companyName
    .toLowerCase()
    .trim()
    // Replace spaces and special chars with underscore
    .replace(/[^a-z0-9]+/g, '_')
    // Remove leading/trailing underscores
    .replace(/^_+|_+$/g, '')
    // Limit length
    .substring(0, 30);

  if (!baseUsername) {
    // Fallback if name has no valid characters
    return await generateUniqueUsernameWithSuffix("company");
  }

  // Check if base username is available
  const { data: existing } = await admin
    .from("profiles")
    .select("username")
    .eq("username", baseUsername)
    .maybeSingle();

  if (!existing) {
    // Base username is available
    return baseUsername;
  }

  // Base username taken, find next available with numeric suffix
  return await findAvailableUsername(baseUsername);
}

/**
 * Find available username by adding numeric suffix
 */
async function findAvailableUsername(baseUsername: string): Promise<string> {
  const admin = getSupabaseAdmin();
  
  // Get all usernames that start with the base
  const { data: existingUsernames } = await admin
    .from("profiles")
    .select("username")
    .like("username", `${baseUsername}%`);

  if (!existingUsernames || existingUsernames.length === 0) {
    return baseUsername;
  }

  // Extract numeric suffixes
  const suffixes: number[] = [];
  const usernameSet = new Set(existingUsernames.map(u => u.username));

  // Add 0 if base username exists
  if (usernameSet.has(baseUsername)) {
    suffixes.push(0);
  }

  // Extract numeric suffixes from usernames like "google_1", "google_2"
  for (const username of usernameSet) {
    const match = username.match(new RegExp(`^${escapeRegex(baseUsername)}_(\\d+)$`));
    if (match) {
      suffixes.push(parseInt(match[1], 10));
    }
  }

  // Find next available number
  if (suffixes.length === 0) {
    // No suffixed versions exist, but base exists
    return `${baseUsername}_1`;
  }

  // Sort and find first gap or use max+1
  suffixes.sort((a, b) => a - b);
  
  // Check for gaps in sequence
  for (let i = 1; i < 1000; i++) {
    if (!suffixes.includes(i)) {
      return `${baseUsername}_${i}`;
    }
  }

  // Fallback: use max + 1
  const maxSuffix = Math.max(...suffixes);
  return `${baseUsername}_${maxSuffix + 1}`;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate unique username with random suffix (fallback)
 */
async function generateUniqueUsernameWithSuffix(prefix: string): Promise<string> {
  const admin = getSupabaseAdmin();
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const randomStr = Math.random().toString(36).substring(2, 7).toLowerCase();
    const username = `${prefix}_${randomStr}`;

    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (!data) {
      return username;
    }
  }

  // Final fallback with timestamp
  return `${prefix}_${Date.now().toString(36)}`;
}
