import { z } from "zod";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { getBillingAccess } from "@/lib/billing/access";
import { hashEmployeePin } from "@/lib/employee-pin";
import { readRequestTextLimited, RequestBodyTooLargeError } from "@/lib/http/request-body";

export const dynamic = "force-dynamic";
const schema = z.object({
  nome: z.string().trim().min(2).max(120),
  pin: z.string().regex(/^\d{4}$/),
  confirmPin: z.string().regex(/^\d{4}$/),
}).strict().refine(value => value.pin === value.confirmPin);

export async function POST(request: Request) {
  let context: Awaited<ReturnType<typeof getWorkspaceContext>> = null;
  let provisioningId = "";
  let createdUserId = "";
  try {
    assertSameOrigin(request);
    context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    if (!context.ownerIsLeader || context.employeeMode) throw new WorkspaceError("team-leader-required", 403);
    const billing = await getBillingAccess(context.admin, context.tenantId);
    if (!billing.allowed) throw new WorkspaceError("subscription-required", 402);
    let raw: string;
    try { raw = await readRequestTextLimited(request, 4096); }
    catch (error) { if (error instanceof RequestBodyTooLargeError) throw new WorkspaceError("payload-too-large", 413); throw error; }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new WorkspaceError("invalid-payload", 400); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) throw new WorkspaceError("invalid-employee", 400);

    const { data: teamProfiles, error: teamProfilesError } = await context.admin.from("profiles")
      .select("nome").eq("tenant_id", context.tenantId).eq("papel", "funcionario");
    if (teamProfilesError) throw new WorkspaceError("employee-storage-unavailable", 503);
    if ((teamProfiles || []).some(profile => String(profile.nome || "").trim().toLowerCase() === parsed.data.nome.toLowerCase())) {
      throw new WorkspaceError("employee-name-already-exists", 409);
    }

    const { count, error: countError } = await context.admin.from("graficalc_employee_provisioning")
      .select("id", { count: "exact", head: true }).eq("tenant_id", context.tenantId)
      .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
    if (countError) throw new WorkspaceError("employee-storage-unavailable", 503);
    if ((count || 0) >= 20) throw new WorkspaceError("employee-rate-limited", 429);

    const internalId = randomUUID();
    const email = `employee+${internalId}@staff.graficalc.invalid`;
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const { data: provisioning, error: provisioningError } = await context.admin.from("graficalc_employee_provisioning")
      .insert({ tenant_id: context.tenantId, invited_by: context.sessionUser.id, email, nome: parsed.data.nome, token_hash: tokenHash })
      .select("id").single();
    if (provisioningError || !provisioning) throw new WorkspaceError("employee-storage-unavailable", 503);
    provisioningId = provisioning.id;

    const { data: auth, error: authError } = await context.admin.auth.admin.createUser({
      email, password: randomBytes(48).toString("base64url"), email_confirm: true,
      user_metadata: { nome: parsed.data.nome, graficalc_employee_token: token },
    });
    if (authError || !auth.user) throw new WorkspaceError("employee-provisioning-failed", 502);
    createdUserId = auth.user.id;

    const { data: profile, error: profileError } = await context.admin.from("profiles")
      .select("id,tenant_id,nome,papel,criado_em").eq("id", auth.user.id).maybeSingle();
    if (profileError || profile?.tenant_id !== context.tenantId || profile?.papel !== "funcionario") {
      throw new WorkspaceError("employee-provisioning-failed", 503);
    }
    const pin = hashEmployeePin(parsed.data.pin);
    const { error: pinError } = await context.admin.from("graficalc_employee_pins").insert({
      tenant_id: context.tenantId, user_id: auth.user.id, pin_salt: pin.salt, pin_hash: pin.hash,
      pin_version: 1, active: true, updated_by: context.sessionUser.id,
    });
    if (pinError) throw new WorkspaceError("employee-pin-storage-unavailable", 503);
    return Response.json({ ok: true, member: {
      id: profile.id, username: profile.nome, email: "", company: context.profile.empresa,
      role: "employee", developerAccess: false, status: "active", groupId: "funcionarios",
      teamLeader: false, createdAt: profile.criado_em, emailVerification: { status: "verified" },
    } }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (context && createdUserId) await context.admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    if (context && provisioningId) await context.admin.from("graficalc_employee_provisioning")
      .delete().eq("id", provisioningId).eq("status", "pending");
    return workspaceError(error);
  }
}
