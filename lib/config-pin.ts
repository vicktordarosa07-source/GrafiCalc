import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVELOPER_EMAIL } from "@/lib/developer-session";

export function hashPin(pin: string) {
  return createHash("sha256").update(pin).digest("hex");
}

export function validPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

export const CONFIG_PIN_COOKIE = "graficalc_config_pin_verified";

function sessionSecret() {
  const secret = String(process.env.GRAFICALC_SESSION_SECRET || "").trim();
  if (!secret) throw new Error("GRAFICALC_SESSION_SECRET must be configured.");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

export function createPinVerificationToken(userId: string, tenantId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, tenantId, expiresAt: Date.now() + 10 * 60 * 1000 }), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export async function hasValidPinVerification(userId: string, tenantId: string) {
  const token = (await cookies()).get(CONFIG_PIN_COOKIE)?.value || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return false;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return decoded.userId === userId && decoded.tenantId === tenantId && Number(decoded.expiresAt) > Date.now();
  } catch {
    return false;
  }
}

export async function getPinContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("id,tenant_id,papel,email").eq("id", user.id).maybeSingle();
  const isCreator = String(user.email || "").trim().toLowerCase() === DEVELOPER_EMAIL;
  let tenantId = profile?.tenant_id || "";
  if (isCreator && process.env.GRAFICALC_TENANT_SLUG) {
    const { data: tenant } = await admin.from("graficalc_tenants").select("id").eq("slug", process.env.GRAFICALC_TENANT_SLUG.trim().toLowerCase()).maybeSingle();
    tenantId = tenant?.id || tenantId;
  }
  if (!tenantId) return null;
  const { data: runtime } = await admin.from("graficalc_runtime_state").select("payload").eq("tenant_id", tenantId).maybeSingle();
  const payload = runtime?.payload && typeof runtime.payload === "object" ? runtime.payload as Record<string, any> : {};
  const { data: tenant } = await admin.from("graficalc_tenants").select("id,owner_id").eq("id", tenantId).maybeSingle();
  const isLeader = isCreator || tenant?.owner_id === user.id;
  const delegated = payload.security?.accessControl?.configPermissions?.[user.id] || {};
  return { admin, user, isLeader, permissions: { use: isLeader || delegated.use === true, edit: isLeader || delegated.edit === true, managePin: isLeader || delegated.managePin === true }, profile: { ...profile, tenant_id: tenantId, papel: isCreator ? "admin" : profile?.papel }, payload };
}

export async function writePinPayload(context: Awaited<ReturnType<typeof getPinContext>>, payload: Record<string, any>) {
  if (!context) throw new Error("unauthorized");
  await context.admin.from("graficalc_runtime_state").upsert({ tenant_id: context.profile.tenant_id, payload, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
}

export function createTemporaryPin() {
  return String(randomInt(100000, 1000000));
}

export async function sendPinEmail(to: string, pin: string) {
  const key = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim();
  if (!key || !from) throw new Error("email-not-configured");
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to, subject: "GrafiCalc | PIN temporário de segurança", html: `<p>Seu PIN temporário do GrafiCalc é:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px">${pin}</p><p>Use-o uma única vez no campo PIN atual para cadastrar um novo PIN. Ele expira em 10 minutos.</p>` }) });
  if (!response.ok) throw new Error("email-send-failed");
}
