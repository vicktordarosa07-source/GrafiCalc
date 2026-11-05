export function createContentSecurityPolicy(nonce: string, isDevelopment = false): string {
  // Next Image emits this exact style on the auth logo; hash only this attribute instead of allowing arbitrary inline styles.
  const nextImageFallbackStyleHash = "'sha256-zlqnbDt84zf1iSefLU/ImC54isoprH/MRiVZGskwexk='";
  const scriptDirectives = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://challenges.cloudflare.com",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ];

  return [
    "default-src 'self'",
    `script-src ${scriptDirectives.join(" ")}`,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-hashes' ${nextImageFallbackStyleHash}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com",
    "frame-src 'self' https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");
}
