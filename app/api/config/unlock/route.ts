import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEVELOPER_COOKIE, DEVELOPER_EMAIL, readDeveloperSession } from "@/lib/developer-session";

export const dynamic = "force-dynamic";

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return Response.json({ ok: false, error: "invalid-origin" }, { status: 403 });
    } catch {
      return Response.json({ ok: false, error: "invalid-origin" }, { status: 403 });
    }
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const session = readDeveloperSession((await cookies()).get(DEVELOPER_COOKIE)?.value);
  if (!user || !user.email_confirmed_at || String(user.email || "").trim().toLowerCase() !== DEVELOPER_EMAIL || session?.userId !== user.id) {
    return Response.json({ ok: false, error: "developer-session-required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = String(body?.password || "").trim();
  const expectedPassword = String(process.env.GRAFICALC_CONFIG_PASSWORD || "").trim();
  if (!expectedPassword) return Response.json({ ok: false, error: "config-password-not-configured" }, { status: 503 });
  if (!password || !secureEqual(password, expectedPassword)) {
    return Response.json({ ok: false, error: "config-unlock-denied" }, { status: 403 });
  }

  return Response.json({ ok: true, developerLoggedIn: true, configUnlocked: true, username: session.username });
}
