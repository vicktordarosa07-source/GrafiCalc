import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isStrongSecret } from "@/lib/security/secret-strength.cjs";

export const EMPLOYEE_MODE_COOKIE = "graficalc_employee_mode";
export const EMPLOYEE_LOCK_COOKIE = "graficalc_employee_lock";
export const EMPLOYEE_MODE_TTL_SECONDS = 8 * 60 * 60;

type EmployeeModeClaims = {
  ownerId: string;
  tenantId: string;
  employeeId: string;
  pinVersion: number;
  expiresAt: number;
  nonce: string;
};
type EmployeeLockClaims = { ownerId: string; tenantId: string; nonce: string };

function secret() {
  const value = String(process.env.GRAFICALC_SESSION_SECRET || "").trim();
  if (!isStrongSecret(value)) throw new Error("GRAFICALC_SESSION_SECRET must be a strong random secret.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createEmployeeModeSession(claims: Omit<EmployeeModeClaims, "expiresAt" | "nonce">) {
  const payload = Buffer.from(JSON.stringify({
    ...claims, expiresAt: Date.now() + EMPLOYEE_MODE_TTL_SECONDS * 1000,
    nonce: randomBytes(16).toString("base64url"),
  } satisfies EmployeeModeClaims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function createEmployeeLock(ownerId: string, tenantId: string) {
  const payload = Buffer.from(JSON.stringify({ ownerId, tenantId, nonce: randomBytes(16).toString("base64url") } satisfies EmployeeLockClaims)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readEmployeeLock(token?: string) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let expected: string;
  try { expected = sign(payload); } catch { return null; }
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmployeeLockClaims;
    return claims.ownerId && claims.tenantId ? claims : null;
  } catch { return null; }
}

export function readEmployeeModeSession(token?: string) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  let expected: string;
  try { expected = sign(payload); } catch { return null; }
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as EmployeeModeClaims;
    if (!claims.ownerId || !claims.tenantId || !claims.employeeId || !Number.isInteger(claims.pinVersion) || claims.expiresAt <= Date.now()) return null;
    return claims;
  } catch { return null; }
}

export function employeeModeCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: EMPLOYEE_MODE_TTL_SECONDS,
  };
}

export function employeeLockCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: 365 * 24 * 60 * 60 };
}
