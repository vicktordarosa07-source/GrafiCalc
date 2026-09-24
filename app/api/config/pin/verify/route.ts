import { hashPin, getPinContext, createPinVerificationToken, CONFIG_PIN_COOKIE } from "@/lib/config-pin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const context = await getPinContext();
  if (!context) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  if (!context.permissions.edit) return Response.json({ ok: false, error: "config-edit-forbidden" }, { status: 403 });
  const body = await request.json().catch(() => null) as { pin?: string } | null;
  const pin = String(body?.pin || "");
  const access = context.payload.config?.security?.configAccess || {};
  const valid = access.pinHash ? access.pinHash === hashPin(pin) : String(access.password || "") === pin;
  if (!valid) return Response.json({ ok: false, error: "invalid-pin" }, { status: 403 });
  const response = Response.json({ ok: true });
  response.headers.append("Set-Cookie", `${CONFIG_PIN_COOKIE}=${createPinVerificationToken(context.user.id, context.profile.tenant_id)}; Path=/; Max-Age=600; HttpOnly; SameSite=Strict${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  return response;
}
