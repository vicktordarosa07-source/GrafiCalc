import { getWorkspaceContext, writeWorkspace, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, assertWorkspaceBinding, mergeWorkspace, publicWorkspace, WorkspaceError } from "@/lib/workspace-policy";
import { hasValidPinVerification, CONFIG_PIN_COOKIE } from "@/lib/config-pin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

function snapshot(context: NonNullable<Awaited<ReturnType<typeof getWorkspaceContext>>>, payload = context.payload, updatedAt = context.updatedAt) {
  const visible = publicWorkspace(payload, context.memberIds);
  visible.security.authUsers = context.members;
  return Response.json({ exists: true, payload: visible, updatedAt, userId: context.user.id, tenantId: context.tenantId, permissions: context.permissions, isLeader: context.isLeader }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  try {
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    return snapshot(context);
  } catch (error) { return workspaceError(error); }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    if (Number(request.headers.get("content-length")) > 15_000_000) throw new WorkspaceError("payload-too-large", 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 15_000_000) throw new WorkspaceError("payload-too-large", 413);
    let body;
    try { body = JSON.parse(raw); } catch { throw new WorkspaceError("invalid-payload", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new WorkspaceError("invalid-payload", 400);
    if (!Object.hasOwn(body, "baseUpdatedAt") || body.baseUpdatedAt !== context.updatedAt) throw new WorkspaceError("workspace-conflict", 409);
    const publishConfig = body.publishConfig === true;
    const payload = mergeWorkspace(context.payload, body, {
      isLeader: context.isLeader, canEdit: context.permissions.edit, memberIds: context.memberIds, publishConfig,
      pinVerified: publishConfig && await hasValidPinVerification(context.user.id, context.tenantId, context.payload.config?.security?.configAccess, context.updatedAt),
    });
    const updatedAt = await writeWorkspace(context, payload);
    if (publishConfig) (await cookies()).delete(CONFIG_PIN_COOKIE);
    return snapshot(context, payload, updatedAt);
  } catch (error) { return workspaceError(error); }
}
