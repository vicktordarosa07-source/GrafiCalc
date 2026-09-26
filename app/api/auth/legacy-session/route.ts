import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { WorkspaceError } from "@/lib/workspace-policy";

export async function GET() {
  try {
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    return Response.json({ ...context.profile, teamLeader: context.isLeader,
      configPermissions: context.permissions, members: context.members,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
