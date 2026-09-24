import { hashPin, getPinContext, validPin } from "@/lib/config-pin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getPinContext();
  if (!context) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!context.permissions.managePin) return Response.json({ ok: false, error: "pin-management-forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { currentPin?: string; newPin?: string; confirmPin?: string } | null;
  const currentPin = String(body?.currentPin || "");
  const newPin = String(body?.newPin || "");
  if (!validPin(newPin) || newPin !== String(body?.confirmPin || "")) return Response.json({ ok: false, error: "invalid-pin" }, { status: 400 });
  const access = context.payload.config?.security?.configAccess || {};
  const temporaryValid = access.temporaryPinHash && access.temporaryPinHash === hashPin(currentPin) && new Date(access.temporaryPinExpiresAt || 0).getTime() > Date.now();
  const currentValid = access.pinHash ? access.pinHash === hashPin(currentPin) : String(access.password || "") === currentPin;
  if (!temporaryValid && !currentValid) return Response.json({ ok: false, error: "invalid-current-pin" }, { status: 403 });
  if (currentValid && access.pinHash === hashPin(newPin)) return Response.json({ ok: false, error: "same-pin" }, { status: 400 });
  const nextAccess = { ...access, mode: "open", pinHash: hashPin(newPin), password: "", temporaryPinHash: "", temporaryPinExpiresAt: "" };
  const payload = { ...context.payload, config: { ...(context.payload.config || {}), security: { ...(context.payload.config?.security || {}), configAccess: nextAccess } } };
  await context.admin.from("graficalc_runtime_state").upsert({ tenant_id: context.profile.tenant_id, payload, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
  return Response.json({ ok: true });
}
