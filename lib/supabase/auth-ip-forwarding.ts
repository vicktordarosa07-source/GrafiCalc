import { isIP } from "node:net";

type HeaderReader = Pick<Headers, "get">;

export type SupabaseAuthClientConfig =
  | { ok: true; apiKey: string; forwardedFor?: string }
  | { ok: false; reason: "secret-key-missing" | "client-ip-missing" | "publishable-key-missing" };

export function getTrustedClientIp(headers: HeaderReader) {
  const forwarded = headers.get("x-forwarded-for");
  const candidate = forwarded?.split(",", 1)[0]?.trim();
  return candidate && isIP(candidate) ? candidate : null;
}

export function resolveSupabaseAuthClientConfig(input: {
  forwardClientIp: boolean;
  clientIp: string | null;
  secretKey?: string | null;
  publishableKey?: string | null;
}): SupabaseAuthClientConfig {
  if (input.forwardClientIp) {
    const secretKey = input.secretKey?.trim();
    if (!secretKey) return { ok: false, reason: "secret-key-missing" };
    if (!input.clientIp || !isIP(input.clientIp)) return { ok: false, reason: "client-ip-missing" };
    return { ok: true, apiKey: secretKey, forwardedFor: input.clientIp };
  }

  const publishableKey = input.publishableKey?.trim();
  if (!publishableKey) return { ok: false, reason: "publishable-key-missing" };
  return { ok: true, apiKey: publishableKey };
}
