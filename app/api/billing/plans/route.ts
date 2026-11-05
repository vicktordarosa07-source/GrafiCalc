import { billingConfig } from "@/lib/billing/catalog";
import { billingResponseError, BillingRequestError, requireBillingOwner } from "@/lib/billing/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { admin, tenantId } = await requireBillingOwner();
    const { plans } = billingConfig();
    const { data: subscription, error: subscriptionError } = await admin
      .from("graficalc_billing_subscriptions").select("trial_started_at").eq("tenant_id", tenantId).maybeSingle();
    if (subscriptionError) throw new BillingRequestError(503, "billing-storage-unavailable");
    const trialUsed = Boolean(subscription?.trial_started_at);
    return Response.json({
      ok: true,
      trialUsed,
      plans: plans.map(({ key, name, description, amountCents, cycle, trialDays, graceDays }) => ({
        key, name, description, amountCents, currency: "BRL", cycle,
        trialDays: trialUsed ? 0 : trialDays, trialConfiguredDays: trialDays, trialUsed, graceDays,
      })),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return billingResponseError(error); }
}
