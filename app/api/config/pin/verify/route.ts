import { getPinContext, validPin, matchesCurrentPin, createPinVerificationToken, CONFIG_PIN_COOKIE, pinAttempt, clearPinAttempts } from "@/lib/config-pin";
import { assertSameOrigin, assertWorkspaceBinding, WorkspaceError } from "@/lib/workspace-policy";
import { workspaceError } from "@/lib/workspace";
import { cookies } from "next/headers";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getPinContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    if (!context.permissions.edit) throw new WorkspaceError("config-edit-forbidden");
    const body = await request.json();
    const pin = String(body?.pin || "");
    const access = context.payload.config?.security?.configAccess || {};
    if (!access.pinHash && !access.password) throw new WorkspaceError("pin-not-configured", 409);
    const key = await pinAttempt(context);
    if (!validPin(pin) || !matchesCurrentPin(pin, access)) throw new WorkspaceError("invalid-pin");
    await clearPinAttempts(context, key);
    (await cookies()).set(CONFIG_PIN_COOKIE, createPinVerificationToken(context.user.id, context.tenantId, context.updatedAt, access), {
      path: "/", maxAge: 120, httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production",
    });
    return Response.json({ ok: true, updatedAt: context.updatedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return workspaceError(error); }
}
