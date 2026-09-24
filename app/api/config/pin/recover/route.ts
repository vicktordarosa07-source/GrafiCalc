import { hashPin, createTemporaryPin, getPinContext, sendPinEmail } from "@/lib/config-pin";

export const dynamic = "force-dynamic";

export async function POST() {
  const context = await getPinContext();
  if (!context) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!context.permissions.managePin) return Response.json({ ok: false, error: "pin-management-forbidden" }, { status: 403 });
  const pin = createTemporaryPin();
  const payload = { ...context.payload, config: { ...(context.payload.config || {}), security: { ...(context.payload.config?.security || {}), configAccess: { ...(context.payload.config?.security?.configAccess || {}), temporaryPinHash: hashPin(pin), temporaryPinExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() } } } };
  try {
    await sendPinEmail(String(context.user.email), pin);
    await context.admin.from("graficalc_runtime_state").upsert({ tenant_id: context.profile.tenant_id, payload, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "pin-recovery-failed" }, { status: 503 });
  }
}
