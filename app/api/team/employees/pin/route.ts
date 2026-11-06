import { z } from "zod";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { hashEmployeePin } from "@/lib/employee-pin";

export const dynamic = "force-dynamic";
const schema = z.object({
  employeeId: z.string().uuid(), pin: z.string().regex(/^\d{4}$/), confirmPin: z.string().regex(/^\d{4}$/),
}).strict().refine(value => value.pin === value.confirmPin);

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    if (!context.ownerIsLeader || context.employeeMode) throw new WorkspaceError("team-leader-required", 403);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-employee-pin", 400);
    const { data: employee, error: employeeError } = await context.admin.from("profiles")
      .select("id").eq("id", parsed.data.employeeId).eq("tenant_id", context.tenantId).eq("papel", "funcionario").maybeSingle();
    if (employeeError) throw new WorkspaceError("employee-storage-unavailable", 503);
    if (!employee) throw new WorkspaceError("employee-not-found", 404);
    const { data: existing, error: existingError } = await context.admin.from("graficalc_employee_pins")
      .select("pin_version").eq("tenant_id", context.tenantId).eq("user_id", employee.id).maybeSingle();
    if (existingError) throw new WorkspaceError("employee-pin-storage-unavailable", 503);
    const hashed = hashEmployeePin(parsed.data.pin);
    const { error } = await context.admin.from("graficalc_employee_pins").upsert({
      tenant_id: context.tenantId, user_id: employee.id, pin_salt: hashed.salt, pin_hash: hashed.hash,
      pin_version: Number(existing?.pin_version || 0) + 1, active: true, updated_by: context.sessionUser.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "tenant_id,user_id" });
    if (error) throw new WorkspaceError("employee-pin-storage-unavailable", 503);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
