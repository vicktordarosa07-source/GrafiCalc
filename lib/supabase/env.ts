const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_PUBLISHABLE_KEY_ENV = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
const SUPABASE_SECRET_KEY_ENV = "SUPABASE_SECRET_KEY";
const SUPABASE_SERVER_URL_ENV = "SUPABASE_URL";
const SUPABASE_SERVER_PUBLISHABLE_KEY_ENV = "SUPABASE_PUBLISHABLE_KEY";

function readRuntimeEnvironment(name: string) {
  return process.env[name]?.trim();
}

// Server-only dynamic lookup prevents NEXT_PUBLIC values from being frozen in
// a deployment build before Vercel injects the production environment.
export function getSupabaseServerEnvironment() {
  return {
    url: readRuntimeEnvironment(SUPABASE_SERVER_URL_ENV) || readRuntimeEnvironment(SUPABASE_URL_ENV),
    publishableKey:
      readRuntimeEnvironment(SUPABASE_SERVER_PUBLISHABLE_KEY_ENV) ||
      readRuntimeEnvironment(SUPABASE_PUBLISHABLE_KEY_ENV),
    secretKey: readRuntimeEnvironment(SUPABASE_SECRET_KEY_ENV),
  };
}

export function getSupabaseServerEnvironmentStatus() {
  return {
    serverUrlConfigured: Boolean(readRuntimeEnvironment(SUPABASE_SERVER_URL_ENV)),
    serverPublishableKeyConfigured: Boolean(readRuntimeEnvironment(SUPABASE_SERVER_PUBLISHABLE_KEY_ENV)),
    publicUrlConfigured: Boolean(readRuntimeEnvironment(SUPABASE_URL_ENV)),
    publicPublishableKeyConfigured: Boolean(readRuntimeEnvironment(SUPABASE_PUBLISHABLE_KEY_ENV)),
  };
}
