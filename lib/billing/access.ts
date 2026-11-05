import { WorkspaceError } from "@/lib/workspace-policy";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveBillingAccess, type BillingAccess } from "@/lib/billing/entitlement";

export async function getBillingAccess(admin: ReturnType<typeof createAdminClient>, tenantId: string, now = new Date()): Promise<BillingAccess> {
  if (process.env.GRAFICALC_BILLING_ENFORCEMENT !== "true") return { allowed: true, reason: "enforcement-disabled" };
  if (process.env.GRAFICALC_BILLING_ENABLED !== "true") throw new WorkspaceError("billing-configuration-unavailable", 503);
  const { data, error } = await admin.from("graficalc_billing_subscriptions")
    .select("status,trial_ends_at,current_period_end,grace_days")
    .eq("tenant_id", tenantId).maybeSingle();
  if (error) throw new WorkspaceError("billing-status-unavailable", 503);
  return deriveBillingAccess(data, now);
}
