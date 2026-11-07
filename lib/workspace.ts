import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeveloperEligible } from "@/lib/developer-session";
import { configPermissions, WorkspaceError, type JsonObject } from "@/lib/workspace-policy";
import { ADMIN_MODE_COOKIE, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE, adminPinVersion, readAdminModeSession, readEmployeeLock, readEmployeeModeSession } from "@/lib/employee-mode";
import { cookies } from "next/headers";

export async function getWorkspaceContext() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user?.email_confirmed_at) return null;
  const admin = createAdminClient();
  const { data: profile, error } = await admin.from("profiles").select("id,tenant_id,papel,nome,empresa,email,cpf_cnpj,criado_em").eq("id", user.id).maybeSingle();
  if (error) throw new WorkspaceError("profile-query-failed", 503);
  let tenantId = profile?.tenant_id;
  const isCreator = isDeveloperEligible(user);
  const slug = process.env.GRAFICALC_TENANT_SLUG?.trim().toLowerCase();
  if (isCreator && slug) {
    const { data: legacy, error: legacyError } = await admin.from("graficalc_tenants").select("id,owner_id").eq("slug", slug).maybeSingle();
    if (legacyError) throw new WorkspaceError("tenant-query-failed", 503);
    if (legacy && (!legacy.owner_id || legacy.owner_id === user.id)) tenantId = legacy.id;
  }
  if (!tenantId) throw new WorkspaceError("workspace-not-provisioned", 403);
  const [{ data: tenant, error: tenantError }, { data: runtime, error: runtimeError }, { data: profiles, error: membersError }] = await Promise.all([
    admin.from("graficalc_tenants").select("id,owner_id").eq("id", tenantId).maybeSingle(),
    admin.from("graficalc_runtime_state").select("payload,updated_at").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("profiles").select("id,nome,email,empresa,papel,criado_em,email_confirmado").eq("tenant_id", tenantId),
  ]);
  if (tenantError || runtimeError || membersError || !tenant) throw new WorkspaceError("workspace-read-failed", 503);
  const payload: JsonObject = runtime?.payload && typeof runtime.payload === "object" ? runtime.payload : {};
  const ownerIsLeader = tenant.owner_id === user.id || (isCreator && !tenant.owner_id);
  const isLeader = ownerIsLeader;
  const sessionCookie = (await cookies()).get(EMPLOYEE_MODE_COOKIE)?.value;
  const employeeSession = readEmployeeModeSession(sessionCookie);
  const lockCookie = (await cookies()).get(EMPLOYEE_LOCK_COOKIE)?.value;
  const employeeLock = readEmployeeLock(lockCookie);
  const hasEmployeeLock = employeeLock?.ownerId === user.id && employeeLock.tenantId === String(tenantId);
  if (hasEmployeeLock && (!employeeSession || employeeSession.ownerId !== user.id || employeeSession.tenantId !== String(tenantId))) {
    throw new WorkspaceError("workspace-access-mode-required", 423);
  }
  let employeeMode = false;
  let effectiveUser = user;
  let effectiveProfile = profile;
  if (employeeSession && employeeSession.ownerId === user.id && employeeSession.tenantId === String(tenantId)) {
    const [{ data: employeeProfile, error: employeeProfileError }, { data: pin, error: pinError }] = await Promise.all([
      admin.from("profiles").select("id,tenant_id,papel,nome,empresa,email,cpf_cnpj,criado_em,email_confirmado").eq("id", employeeSession.employeeId).eq("tenant_id", tenantId).eq("papel", "funcionario").maybeSingle(),
      admin.from("graficalc_employee_pins").select("pin_version,active").eq("tenant_id", tenantId).eq("user_id", employeeSession.employeeId).maybeSingle(),
    ]);
    if (employeeProfileError || pinError) throw new WorkspaceError("employee-session-unavailable", 503);
    if (!employeeProfile || !pin?.active || pin.pin_version !== employeeSession.pinVersion) {
      (await cookies()).delete(EMPLOYEE_MODE_COOKIE);
      if (hasEmployeeLock) throw new WorkspaceError("employee-owner-unlock-required", 423);
    } else {
      employeeMode = true;
      effectiveUser = { ...user, id: employeeProfile.id, email: undefined };
      effectiveProfile = employeeProfile;
    }
  }
  if (ownerIsLeader && !employeeMode) {
    const adminSession = readAdminModeSession((await cookies()).get(ADMIN_MODE_COOKIE)?.value);
    const adminPin = payload.config?.security?.configAccess || {};
    const pinValue = String(adminPin.pinHash || adminPin.password || "");
    if (!adminSession || adminSession.ownerId !== user.id || adminSession.tenantId !== String(tenantId)
      || adminSession.pinVersion !== adminPinVersion(pinValue)) {
      throw new WorkspaceError("workspace-access-mode-required", 423);
    }
  }
  const memberIds = new Set<string>((profiles || []).map(p => p.id));
  memberIds.add(user.id);
  const members = (profiles || []).map(p => ({
    id: p.id, username: p.nome, email: p.papel === "funcionario" ? "" : p.email, company: p.empresa,
    role: p.papel === "funcionario" ? "employee" : "user", developerAccess: false,
    groupId: p.papel === "funcionario" ? "funcionarios" : "profissional",
    status: p.email_confirmado ? "active" : "pending", teamLeader: p.id === tenant.owner_id,
    createdAt: p.criado_em, emailVerification: { status: p.email_confirmado ? "verified" : "pending" },
  }));
  return {
    admin, user: effectiveUser, sessionUser: user, tenantId: String(tenantId), isCreator: employeeMode ? false : isCreator,
    isLeader: employeeMode ? false : isLeader, ownerIsLeader, employeeMode, memberIds,
    members: employeeMode ? members.filter(member => member.role === "employee") : members,
    profile: { ...(effectiveProfile || {}), id: effectiveUser.id, email: employeeMode ? "" : user.email, tenant_id: String(tenantId), employeeMode },
    payload, updatedAt: runtime?.updated_at || null,
    permissions: configPermissions(payload, effectiveUser.id, employeeMode ? false : isLeader),
  };
}

export type WorkspaceContext = NonNullable<Awaited<ReturnType<typeof getWorkspaceContext>>>;

export async function writeWorkspace(context: WorkspaceContext, payload: JsonObject) {
  // Compare-and-swap protects collection edits and one-use PINs from concurrent requests.
  const table = context.admin.from("graficalc_runtime_state");
  const row = { tenant_id: context.tenantId, payload, updated_at: new Date().toISOString() };
  const result = context.updatedAt
    ? await table.update(row).eq("tenant_id", context.tenantId).eq("updated_at", context.updatedAt).select("updated_at").maybeSingle()
    : await table.insert(row).select("updated_at").maybeSingle();
  if (result.error?.code === "23505" || (!result.error && !result.data)) throw new WorkspaceError("workspace-conflict", 409);
  if (result.error) throw new WorkspaceError("workspace-write-failed", 503);
  return result.data!.updated_at as string;
}

export function workspaceError(error: unknown) {
  return Response.json({ ok: false, error: error instanceof WorkspaceError ? error.message : "workspace-unavailable" }, {
    status: error instanceof WorkspaceError ? error.status : 503,
    headers: { "Cache-Control": "private, no-store" },
  });
}
