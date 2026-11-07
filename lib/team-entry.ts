import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeveloperEligible } from "@/lib/developer-session";
import { WorkspaceError } from "@/lib/workspace-policy";

export async function getTeamEntryContext() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email_confirmed_at) throw new WorkspaceError("unauthorized", 401);
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles")
    .select("id,tenant_id,papel").eq("id", user.id).maybeSingle();
  if (profileError) throw new WorkspaceError("profile-query-failed", 503);
  let tenantId = profile?.tenant_id;
  const creator = isDeveloperEligible(user);
  const configuredSlug = process.env.GRAFICALC_TENANT_SLUG?.trim().toLowerCase();
  if (!tenantId && creator && configuredSlug) {
    const { data: legacy, error } = await admin.from("graficalc_tenants")
      .select("id,owner_id").eq("slug", configuredSlug).maybeSingle();
    if (error) throw new WorkspaceError("tenant-query-failed", 503);
    if (!legacy || (legacy.owner_id && legacy.owner_id !== user.id)) throw new WorkspaceError("workspace-not-provisioned", 403);
    tenantId = legacy.id;
  }
  if (!tenantId) throw new WorkspaceError("workspace-not-provisioned", 403);
  const [{ data: tenant, error: tenantError }, { data: runtime, error: runtimeError }, { data: profiles, error: profilesError }, { data: pins, error: pinsError }] = await Promise.all([
    admin.from("graficalc_tenants").select("id,owner_id").eq("id", tenantId).maybeSingle(),
    admin.from("graficalc_runtime_state").select("payload,updated_at").eq("tenant_id", tenantId).maybeSingle(),
    admin.from("profiles").select("id,nome").eq("tenant_id", tenantId).eq("papel", "funcionario").order("nome"),
    admin.from("graficalc_employee_pins").select("user_id,active").eq("tenant_id", tenantId),
  ]);
  if (tenantError || runtimeError || profilesError || pinsError || !tenant) throw new WorkspaceError("employee-session-unavailable", 503);
  const ownerIsLeader = tenant.owner_id === user.id || (creator && !tenant.owner_id);
  if (!ownerIsLeader) throw new WorkspaceError("team-leader-required", 403);
  const pinByUser = new Map((pins || []).map(pin => [pin.user_id, pin]));
  const payload = runtime?.payload && typeof runtime.payload === "object" ? runtime.payload : {};
  const adminPin = payload.config?.security?.configAccess || {};
  return {
    admin, user, tenantId: String(tenantId), payload, updatedAt: runtime?.updated_at || null,
    adminPinConfigured: Boolean(adminPin.pinHash || adminPin.password),
    adminPinValue: String(adminPin.pinHash || adminPin.password || ""),
    adminPin,
    employees: (profiles || []).map(profile => {
      const credential = pinByUser.get(profile.id);
      return { id: profile.id, name: profile.nome, pinConfigured: Boolean(credential?.active) };
    }),
  };
}

export type TeamEntryContext = Awaited<ReturnType<typeof getTeamEntryContext>>;
