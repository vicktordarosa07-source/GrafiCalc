import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEVELOPER_COOKIE = "graficalc_developer_session";
export const DEVELOPER_SESSION_TTL_SECONDS = 30 * 60;
export const DEVELOPER_EMAIL = "hprvisual@hotmail.com";

type DeveloperSession = {
  role: "developer";
  userId: string;
  username: string;
  expiresAt: number;
  nonce: string;
};

function sessionSecret() {
  const secret = String(process.env.GRAFICALC_SESSION_SECRET || "").trim();
  if (!secret) throw new Error("GRAFICALC_SESSION_SECRET must be configured.");
  return secret;
}

function configuredDeveloperUsername() {
  return String(process.env.GRAFICALC_DEVELOPER_USERNAME || "").trim();
}

export function isDeveloperEligible(user: { id?: string; email?: string | null } | null | undefined) {
  if (!user) return false;
  return String(user.email || "").trim().toLowerCase() === DEVELOPER_EMAIL;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode(value: string) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as DeveloperSession;
}

export function createDeveloperSession(userId: string) {
  const payload = encode({
    role: "developer",
    userId,
    username: configuredDeveloperUsername(),
    expiresAt: Date.now() + DEVELOPER_SESSION_TTL_SECONDS * 1000,
    nonce: randomBytes(16).toString("base64url"),
  } satisfies DeveloperSession);
  return `${payload}.${sign(payload)}`;
}

export function readDeveloperSession(token: string | undefined) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const session = decode(payload);
    if (session.role !== "developer" || session.expiresAt <= Date.now() || !session.userId) return null;
    return session;
  } catch {
    return null;
  }
}

export function secureCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: DEVELOPER_SESSION_TTL_SECONDS,
  };
}
