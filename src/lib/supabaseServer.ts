import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function getSupabaseServer() {
  // Await the cookie store once (Next 16 async dynamic API), then provide sync methods to SSR.
  const store: any = await (cookies as any)();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (store && typeof store.getAll === "function") return store.getAll();
          return [] as { name: string; value: string }[];
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (store && typeof store.set === "function") {
                store.set(name, value, options as CookieOptions);
              }
            });
          } catch {
            // ignore when cookie store isn't available (edge/runtime)
          }
        },
      },
    }
  );
}
