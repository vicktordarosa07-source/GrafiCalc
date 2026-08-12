import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const LEGACY_CREDENTIAL_KEYS = new Set([
  "password",
  "passwordMode",
  "mustChangePassword",
  "temporaryPasswordIssuedAt",
]);

function sanitizeLegacyCredentials(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeLegacyCredentials);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !LEGACY_CREDENTIAL_KEYS.has(key))
      .map(([key, nested]) => [key, sanitizeLegacyCredentials(nested)]),
  );
}

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return null;
  const { data: profile } = await supabase.from("profiles").select("tenant_id,papel").eq("id", user.id).single();
  return profile ? { profile } : null;
}

function hasValidOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return Boolean(host) && new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function GET() {
  const auth = await context();
  if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("graficalc_runtime_state").select("payload,updated_at").eq("tenant_id", auth.profile.tenant_id).maybeSingle();
  if (error) return Response.json({ error: "shared-state-read-failed" }, { status: 500 });
  return Response.json({
    exists: Boolean(data),
    payload: data?.payload ? sanitizeLegacyCredentials(data.payload) : null,
    updatedAt: data?.updated_at || null,
  });
}

export async function PUT(request: Request) {
  if (!hasValidOrigin(request)) return Response.json({ error: "invalid-origin" }, { status: 403 });
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 15_000_000) return Response.json({ error: "payload-too-large" }, { status: 413 });
  const auth = await context();
  if (!auth) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 15_000_000) {
    return Response.json({ error: "payload-too-large" }, { status: 413 });
  }
  const incoming = (() => {
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return null;
    }
  })();
  if (!incoming || typeof incoming !== "object") return Response.json({ error: "invalid-payload" }, { status: 400 });
  const admin = createAdminClient();
  let payload = sanitizeLegacyCredentials(incoming) as Record<string, unknown>;
  if (auth.profile.papel !== "admin") {
    const { data: current } = await admin.from("graficalc_runtime_state").select("payload").eq("tenant_id", auth.profile.tenant_id).maybeSingle();
    const previous = sanitizeLegacyCredentials(current?.payload || {}) as Record<string, unknown>;
    const protectedKeys = ["config", "security", "users", "userDirectory", "accessGroups", "dashboardOverrides"];
    payload = { ...payload };
    protectedKeys.forEach((key) => {
      if (key in previous) payload[key] = previous[key];
      else delete payload[key];
    });
  }
  const { data, error } = await admin.from("graficalc_runtime_state").upsert({ tenant_id: auth.profile.tenant_id, payload, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" }).select("payload,updated_at").single();
  if (error) return Response.json({ error: "shared-state-write-failed" }, { status: 500 });
  return Response.json({ exists: true, payload: data.payload, updatedAt: data.updated_at });
}
