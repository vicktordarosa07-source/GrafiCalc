import { hashPin, createTemporaryPin, getPinContext, sendPinEmail, writePinAccess, pinAttempt } from "@/lib/config-pin";
import { assertSameOrigin, assertWorkspaceBinding, WorkspaceError } from "@/lib/workspace-policy";
import { workspaceError } from "@/lib/workspace";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getPinContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    if (!context.permissions.managePin) throw new WorkspaceError("pin-management-forbidden");
    await pinAttempt(context, "pin-recovery");
    const access = context.payload.config?.security?.configAccess || {};
    if (new Date(access.temporaryPinExpiresAt || 0).getTime() > Date.now() + 9 * 60_000) throw new WorkspaceError("too-many-attempts", 429);
    const pin = createTemporaryPin();
    await writePinAccess(context, { ...access, temporaryPinHash: hashPin(pin), temporaryPinUserId: context.user.id, temporaryPinExpiresAt: new Date(Date.now() + 600_000).toISOString() });
    await sendPinEmail(String(context.user.email), pin);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return workspaceError(error); }
}
