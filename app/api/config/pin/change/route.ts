import { hashPin, getPinContext, validPin, matchesPin, matchesCurrentPin, writePinAccess, pinAttempt, clearPinAttempts, CONFIG_PIN_COOKIE } from "@/lib/config-pin";
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
    if (!context.permissions.managePin) throw new WorkspaceError("pin-management-forbidden");
    const body = await request.json();
    const currentPin = String(body?.currentPin || ""), newPin = String(body?.newPin || "");
    if (!validPin(newPin) || newPin !== body?.confirmPin) throw new WorkspaceError("invalid-pin", 400);
    const key = await pinAttempt(context);
    const access = context.payload.config?.security?.configAccess || {};
    const configured = Boolean(access.pinHash || access.password);
    const temporaryValid = access.temporaryPinUserId === context.user.id && matchesPin(currentPin, access.temporaryPinHash)
      && new Date(access.temporaryPinExpiresAt || 0).getTime() > Date.now();
    if (configured ? !temporaryValid && !matchesCurrentPin(currentPin, access) : Boolean(currentPin)) throw new WorkspaceError("invalid-current-pin");
    if (matchesCurrentPin(newPin, access)) throw new WorkspaceError("same-pin", 400);
    const updatedAt = await writePinAccess(context, { mode: "open", pinHash: hashPin(newPin) });
    await clearPinAttempts(context, key);
    (await cookies()).delete(CONFIG_PIN_COOKIE);
    return Response.json({ ok: true, updatedAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return workspaceError(error); }
}
