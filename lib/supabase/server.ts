import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabaseServerEnvironment();

  if (!url || !publishableKey) {
    throw new Error("Supabase public configuration is unavailable.");
  }

  return createServerClient(
    url,
    publishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. proxy.ts refreshes them.
          }
        },
      },
    },
  );
}
