export function isBillingSameOrigin(
  originValue: string | null,
  hostValue: string | null,
  forwardedProtocol: string | null,
  requestUrl: string,
): boolean {
  if (!originValue || !hostValue) return false;
  try {
    const request = new URL(requestUrl);
    const origin = new URL(originValue);
    const host = hostValue.trim().toLowerCase();
    const protocol = (forwardedProtocol || request.protocol.slice(0, -1)).trim().toLowerCase();
    if (!host || !["http", "https"].includes(protocol)) return false;
    if (originValue !== origin.origin || origin.username || origin.password) return false;
    return origin.origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}
