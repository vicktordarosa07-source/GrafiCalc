import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createDeveloperSession, DEVELOPER_COOKIE, DEVELOPER_EMAIL, isDeveloperEligible, readDeveloperSession } from "@/lib/developer-session";

export const dynamic = "force-dynamic";
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

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
  let developerEligible = false;
  let developerLoggedIn = false;
  let username = "";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    developerEligible = Boolean(user?.email_confirmed_at && isDeveloperEligible(user));
    const session = developerEligible ? readDeveloperSession((await cookies()).get(DEVELOPER_COOKIE)?.value) : null;
    developerLoggedIn = Boolean(session?.userId === user?.id);
    username = session?.username || "";
  } catch {
    // Health remains public even when Supabase is not configured.
  }
  return NextResponse.json({ ok: true, status: "ok", developerEligible, developerLoggedIn, configUnlocked: false, username }, {
    headers: { "Cache-Control": "no-store" },
  });
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
  const key = requestKey(request);
  const now = Date.now();
  const previous = attempts.get(key);
  if (previous && previous.resetAt > now && previous.count >= MAX_ATTEMPTS) {
    return Response.json({ ok: false, error: "too-many-attempts" }, { status: 429, headers: { "Retry-After": String(Math.ceil((previous.resetAt - now) / 1000)) } });
  }
  // The creator can authenticate with the authorized account email even when
  // the internal developer username remains different in Vercel.
  const usernameMatches = secureEqual(username.toLowerCase(), expectedUsername.toLowerCase())
    || secureEqual(username.toLowerCase(), DEVELOPER_EMAIL);
  const passwordMatches = secureEqual(password, expectedPassword);
  if (!usernameMatches || !passwordMatches) {
    const current = previous && previous.resetAt > now
      ? previous
      : { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, { count: current.count + 1, resetAt: current.resetAt });
    return Response.json({ ok: false, error: "invalid-credentials" }, { status: 401 });
  }
  attempts.delete(key);
  const response = Response.json({ ok: true, developerLoggedIn: true, configUnlocked: false, username: expectedUsername, developerEligible: true });
  response.headers.append("Set-Cookie", `${DEVELOPER_COOKIE}=${encodeURIComponent(createDeveloperSession(user.id))}; Path=/; HttpOnly; SameSite=Strict; Max-Age=1800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
