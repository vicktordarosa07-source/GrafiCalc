import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { createDeveloperSession, DEVELOPER_COOKIE, DEVELOPER_EMAIL, isDeveloperEligible, readDeveloperSession } from "@/lib/developer-session";

export const dynamic = "force-dynamic";

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function requestKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "unknown";
}

// Exposes only public configuration state to diagnose a mismatched Vercel setup.
export async function GET() {
  const { url, publishableKey } = getSupabaseServerEnvironment();
  if (!url || !publishableKey) {
    return NextResponse.json({ ok: false, status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const dependency = await fetch(new URL("/auth/v1/health", url), {
      headers: { apikey: publishableKey }, cache: "no-store", signal: AbortSignal.timeout(3500),
    });
    if (!dependency.ok) throw new Error("dependency-unavailable");
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const developerEligible = Boolean(user?.email_confirmed_at && isDeveloperEligible(user));
    const session = developerEligible
      ? readDeveloperSession((await cookies()).get(DEVELOPER_COOKIE)?.value) : null;
    return NextResponse.json({
      ok: true, status: "ok", developerEligible,
      developerLoggedIn: Boolean(user && session && session.userId === user.id),
      configUnlocked: false, username: session?.username || "",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return Response.json({ ok: false, error: "invalid-origin" }, { status: 403 });
      }
    } catch {
      return Response.json({ ok: false, error: "invalid-origin" }, { status: 403 });
    }
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at || !isDeveloperEligible(user)) {
    return Response.json({ ok: false, error: "developer-access-denied" }, { status: 403 });
  }
  const body = await request.json().catch(() => null) as { username?: unknown; password?: unknown } | null;
  const username = String(body?.username || "").trim();
  const password = String(body?.password || "");
  const expectedUsername = String(process.env.GRAFICALC_DEVELOPER_USERNAME || "").trim();
  const expectedPassword = String(process.env.GRAFICALC_DEVELOPER_PASSWORD || "");
  if (!expectedUsername || !expectedPassword || !process.env.GRAFICALC_SESSION_SECRET) {
    return Response.json({ ok: false, error: "developer-auth-not-configured" }, { status: 503 });
  }
  const key = `developer-auth:${user.id}:${requestKey(request)}`;
  let admin;
  try { admin = createAdminClient(); }
  catch { return Response.json({ ok: false, error: "security-not-configured" }, { status: 503 }); }
  const { data: allowed, error: limitError } = await admin.rpc("graficalc_auth_attempt_allowed", { p_key: key });
  if (limitError) return Response.json({ ok: false, error: "rate-limit-unavailable" }, { status: 503 });
  if (!allowed) return Response.json({ ok: false, error: "too-many-attempts" }, { status: 429, headers: { "Retry-After": "900" } });
  // The creator can authenticate with the authorized account email even when
  // the internal developer username remains different in Vercel.
  const usernameMatches = secureEqual(username.toLowerCase(), expectedUsername.toLowerCase())
    || secureEqual(username.toLowerCase(), DEVELOPER_EMAIL);
  const passwordMatches = secureEqual(password, expectedPassword);
  if (!usernameMatches || !passwordMatches) {
    const { error: failureError } = await admin.rpc("graficalc_record_auth_failure", { p_key: key });
    if (failureError) return Response.json({ ok: false, error: "rate-limit-unavailable" }, { status: 503 });
    return Response.json({ ok: false, error: "invalid-credentials" }, { status: 401 });
  }
  const { error: cleanupError } = await admin.rpc("graficalc_clear_auth_failures", { p_key: key });
  if (cleanupError) return Response.json({ ok: false, error: "rate-limit-unavailable" }, { status: 503 });
  const response = Response.json({ ok: true, developerLoggedIn: true, configUnlocked: false, username: expectedUsername, developerEligible: true });
  response.headers.append("Set-Cookie", `${DEVELOPER_COOKIE}=${encodeURIComponent(createDeveloperSession(user.id))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
