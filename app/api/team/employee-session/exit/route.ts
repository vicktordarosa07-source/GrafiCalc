import { assertSameOrigin } from "@/lib/workspace-policy";
import { getTeamEntryContext } from "@/lib/team-entry";
import { workspaceError } from "@/lib/workspace";
import {
  ADMIN_MODE_COOKIE, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE,
  createEmployeeLock, employeeLockCookieOptions,
} from "@/lib/employee-mode";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getTeamEntryContext();
    const cookieJar = await cookies();
    cookieJar.delete(ADMIN_MODE_COOKIE);
    cookieJar.delete(EMPLOYEE_MODE_COOKIE);
    cookieJar.set(EMPLOYEE_LOCK_COOKIE, createEmployeeLock(context.user.id, context.tenantId), employeeLockCookieOptions());
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
