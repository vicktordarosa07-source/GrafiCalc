import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { isRememberSession, sessionCookieOptions } from "@/lib/supabase/session-cookie";

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
      cookieOptions: { maxAge: isRememberSession(cookieStore) ? 30 * 24 * 60 * 60 : undefined },
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            const remember = isRememberSession(cookieStore);
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, sessionCookieOptions(options, remember)),
            );
          } catch {
            // Server Components cannot write cookies. proxy.ts refreshes them.
          }
        },
      },
    },
  );
}
