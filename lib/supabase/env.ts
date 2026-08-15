const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_SECRET_KEY_ENV = "SUPABASE_SECRET_KEY";

function readRuntimeEnvironment(name: string) {
  return process.env[name]?.trim();
}

// Server-only dynamic lookup prevents NEXT_PUBLIC values from being frozen in
// a deployment build before Vercel injects the production environment.
export function getSupabaseServerEnvironment() {
  return {
    url: readRuntimeEnvironment(SUPABASE_URL_ENV),
    publishableKey: readRuntimeEnvironment(SUPABASE_PUBLISHABLE_KEY_ENV),
    secretKey: readRuntimeEnvironment(SUPABASE_SECRET_KEY_ENV),
  };
}
