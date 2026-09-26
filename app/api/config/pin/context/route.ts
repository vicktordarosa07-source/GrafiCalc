import { getPinContext } from "@/lib/config-pin";
import { workspaceError } from "@/lib/workspace";
import { WorkspaceError } from "@/lib/workspace-policy";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const context = await getPinContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    const access = context.payload.config?.security?.configAccess || {};
    return Response.json({ ok: true, permissions: context.permissions, isLeader: context.isLeader,
      userId: context.user.id, tenantId: context.tenantId, pinConfigured: Boolean(access.pinHash || access.password),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
