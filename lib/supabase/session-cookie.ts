import type { CookieOptions } from "@supabase/ssr";

export const REMEMBER_SESSION_COOKIE = "graficalc_remember_session";
export const REMEMBER_SESSION_SECONDS = 30 * 24 * 60 * 60;

export function isRememberSession(cookieStore: { get(name: string): { value: string } | undefined }) {
  return cookieStore.get(REMEMBER_SESSION_COOKIE)?.value === "1";
}

export function sessionCookieOptions(options: CookieOptions | undefined, remember: boolean): CookieOptions {
  const next = { ...(options || {}) };
  if (remember) {
    next.maxAge = REMEMBER_SESSION_SECONDS;
  } else {
    delete next.maxAge;
    delete next.expires;
  }
  return next;
}
