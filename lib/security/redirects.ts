const INTERNAL_URL_BASE = "https://graficalc.invalid";

export function safeInternalRedirect(value: string | null | undefined, fallback = "/workspace") {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) return fallback;

  try {
    const base = new URL(INTERNAL_URL_BASE);
    const candidate = new URL(value, base);
    if (candidate.origin !== base.origin) return fallback;
    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return fallback;
  }
}
