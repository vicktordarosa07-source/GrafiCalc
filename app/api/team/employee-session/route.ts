import { z } from "zod";
import { beginAuthAttempt } from "@/lib/supabase/auth-rate-limit";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { createEmployeeLock, createEmployeeModeSession, employeeLockCookieOptions, employeeModeCookieOptions, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE } from "@/lib/employee-mode";
import { verifyEmployeePin } from "@/lib/employee-pin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
const schema = z.object({ employeeId: z.string().uuid(), pin: z.string().regex(/^\d{4}$/) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    if (!context.ownerIsLeader) throw new WorkspaceError("team-leader-required", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-employee-pin", 400);
    const rateKey = `employee-pin:${context.tenantId}:${parsed.data.employeeId}`;
    if (!await beginAuthAttempt(context.admin, rateKey)) throw new WorkspaceError("too-many-attempts", 429);
    const [{ data: employee, error: employeeError }, { data: credential, error: pinError }] = await Promise.all([
      context.admin.from("profiles").select("id,tenant_id,nome,papel").eq("id", parsed.data.employeeId).eq("tenant_id", context.tenantId).eq("papel", "funcionario").maybeSingle(),
      context.admin.from("graficalc_employee_pins").select("pin_salt,pin_hash,pin_version,active").eq("tenant_id", context.tenantId).eq("user_id", parsed.data.employeeId).maybeSingle(),
    ]);
    if (employeeError || pinError) throw new WorkspaceError("employee-session-unavailable", 503);
    if (!employee || !credential?.active || !verifyEmployeePin(parsed.data.pin, credential.pin_salt, credential.pin_hash)) {
      throw new WorkspaceError("invalid-employee-pin", 401);
    }
    await context.admin.rpc("graficalc_clear_auth_failures", { p_key: rateKey });
    const token = createEmployeeModeSession({
      ownerId: context.sessionUser.id, tenantId: context.tenantId, employeeId: employee.id,
      pinVersion: Number(credential.pin_version),
    });
    const cookieJar = await cookies();
    cookieJar.set(EMPLOYEE_MODE_COOKIE, token, employeeModeCookieOptions());
    cookieJar.set(EMPLOYEE_LOCK_COOKIE, createEmployeeLock(context.sessionUser.id, context.tenantId), employeeLockCookieOptions());
    return Response.json({ ok: true, employee: { id: employee.id, name: employee.nome }, expiresIn: 8 * 60 * 60 }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) { return workspaceError(error); }
}
