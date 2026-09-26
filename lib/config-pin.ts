import { createHash, createHmac, randomBytes, randomInt, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getWorkspaceContext, writeWorkspace, type WorkspaceContext } from "@/lib/workspace";
import { WorkspaceError, type JsonObject } from "@/lib/workspace-policy";

export const getPinContext = getWorkspaceContext;
export const CONFIG_PIN_COOKIE = "graficalc_config_pin_verified";

export function validPin(pin: string) { return /^\d{4,6}$/.test(pin); }

export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt:${salt}:${scryptSync(pin, salt, 32).toString("hex")}`;
}

function equal(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function matchesPin(pin: string, hash: unknown) {
  if (typeof hash !== "string" || !hash || pin.length > 128) return false;
  if (hash.startsWith("scrypt:")) {
    const [, salt, digest] = hash.split(":");
    if (!/^[a-f0-9]{32}$/.test(salt || "") || !/^[a-f0-9]{64}$/.test(digest || "")) return false;
    return equal(scryptSync(pin, salt, 32).toString("hex"), digest);
  }
  return equal(createHash("sha256").update(pin).digest("hex"), hash);
}

export function matchesCurrentPin(pin: string, access: JsonObject) {
  return access.pinHash ? matchesPin(pin, access.pinHash) : Boolean(access.password && equal(pin, access.password));
}

function sign(value: string) {
  const secret = process.env.GRAFICALC_SESSION_SECRET?.trim();
  if (!secret) throw new WorkspaceError("security-not-configured", 503);
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createPinVerificationToken(userId: string, tenantId: string, revision: string | null, access: JsonObject) {
  const payload = Buffer.from(JSON.stringify({ userId, tenantId, revision, version: access.pinHash || access.password, expiresAt: Date.now() + 120_000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function hasValidPinVerification(userId: string, tenantId: string, access: JsonObject = {}, revision: string | null = null) {
  const token = (await cookies()).get(CONFIG_PIN_COOKIE)?.value || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !equal(signature, sign(payload))) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.userId === userId && decoded.tenantId === tenantId && decoded.revision === revision
      && decoded.version === (access.pinHash || access.password) && decoded.expiresAt > Date.now();
  } catch { return false; }
}

export async function pinAttempt(context: WorkspaceContext, purpose = "pin") {
  const key = `${purpose}:${context.tenantId}:${context.user.id}`;
  // Increment before checking so concurrent attempts cannot all observe the old count.
  const { error: recordError } = await context.admin.rpc("graficalc_record_auth_failure", { p_key: key });
  if (recordError) throw new WorkspaceError("rate-limit-unavailable", 503);
  const { data: allowed, error } = await context.admin.rpc("graficalc_auth_attempt_allowed", { p_key: key });
  if (error) throw new WorkspaceError("rate-limit-unavailable", 503);
  if (!allowed) throw new WorkspaceError("too-many-attempts", 429);
  return key;
}

export async function clearPinAttempts(context: WorkspaceContext, key: string) {
  const { error } = await context.admin.rpc("graficalc_clear_auth_failures", { p_key: key });
  if (error) throw new WorkspaceError("rate-limit-unavailable", 503);
}

export async function writePinAccess(context: WorkspaceContext, access: JsonObject) {
  return writeWorkspace(context, { ...context.payload, config: {
    ...(context.payload.config || {}), security: { ...(context.payload.config?.security || {}), configAccess: access },
  } });
}

export function createTemporaryPin() { return String(randomInt(100000, 1000000)); }

export async function sendPinEmail(to: string, pin: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (!key || !from) throw new WorkspaceError("email-not-configured", 503);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: "GrafiCalc | PIN temporario de seguranca",
      html: `<p>Seu PIN temporario do GrafiCalc e:</p><p style="font-size:24px;font-weight:bold">${pin}</p><p>Use uma unica vez no campo PIN atual para cadastrar um novo PIN. Expira em 10 minutos.</p>` }),
  });
  if (!response.ok) throw new WorkspaceError("email-send-failed", 503);
}
