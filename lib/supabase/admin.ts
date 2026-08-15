import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";

export function createAdminClient() {
  const { url, secretKey } = getSupabaseServerEnvironment();
  if (!url || !secretKey) throw new Error("Supabase administrativo nao configurado.");

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
