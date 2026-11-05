const PRODUCTION_PROJECT_REF = "zneombmzsnslpqhggsph";

export function assertWorkspaceApiSandboxTarget({ url, expectedProjectRef, secretKey, publishableKey }) {
  if (!expectedProjectRef || !/^[a-z0-9]{20}$/.test(expectedProjectRef)) {
    throw new Error("Set GRAFICALC_TEST_SUPABASE_PROJECT_REF to the 20-character Sandbox project ref.");
  }
  if (expectedProjectRef === PRODUCTION_PROJECT_REF) {
    throw new Error("workspace-api integration tests refuse the GrafiCalc production project.");
  }

  let parsedUrl;
  try { parsedUrl = new URL(String(url || "")); }
  catch { throw new Error("Set NEXT_PUBLIC_SUPABASE_URL to the dedicated Sandbox project URL."); }

  if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== `${expectedProjectRef}.supabase.co` || parsedUrl.port || parsedUrl.username || parsedUrl.password || parsedUrl.pathname !== "/" || parsedUrl.search || parsedUrl.hash) {
    throw new Error("The Supabase URL must match GRAFICALC_TEST_SUPABASE_PROJECT_REF exactly.");
  }
  if (!secretKey || !publishableKey || secretKey === publishableKey || String(secretKey).startsWith("sb_publishable_")) {
    throw new Error("Set the Sandbox secret key and publishable key; the secret key must be server-only.");
  }
  return expectedProjectRef;
}
