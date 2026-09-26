import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeveloperEligible } from "@/lib/developer-session";
import { configPermissions, WorkspaceError, type JsonObject } from "@/lib/workspace-policy";

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
  const isLeader = tenant.owner_id === user.id || (isCreator && !tenant.owner_id);
  const memberIds = new Set<string>((profiles || []).map(p => p.id));
  memberIds.add(user.id);
  const payload: JsonObject = runtime?.payload && typeof runtime.payload === "object" ? runtime.payload : {};
  const members = (profiles || []).map(p => ({
    id: p.id, username: p.nome, email: p.email, company: p.empresa,
    role: p.papel === "funcionario" ? "employee" : "user", developerAccess: false,
    groupId: p.papel === "funcionario" ? "funcionarios" : "profissional",
    status: p.email_confirmado ? "active" : "pending", teamLeader: p.id === tenant.owner_id,
    createdAt: p.criado_em, emailVerification: { status: p.email_confirmado ? "verified" : "pending" },
  }));
  return {
    admin, user, tenantId: String(tenantId), isCreator, isLeader, memberIds, members,
    profile: { ...profile, id: user.id, email: user.email, tenant_id: String(tenantId) },
    payload, updatedAt: runtime?.updated_at || null,
    permissions: configPermissions(payload, user.id, isLeader),
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
