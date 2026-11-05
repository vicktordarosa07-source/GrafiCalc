import { assertBillingSameOrigin, asaasDeleteSubscription, billingResponseError, BillingRequestError, requireBillingOwner } from "@/lib/billing/server";
import { canCancelBillingRecurrence } from "@/lib/billing/cancellation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    assertBillingSameOrigin(request);
    const { admin, tenantId } = await requireBillingOwner();
    const { data: subscription, error: readError } = await admin.from("graficalc_billing_subscriptions")
      .select("provider_subscription_id,billing_cycle,status,cancel_at_period_end")
      .eq("tenant_id", tenantId).maybeSingle();
    if (readError) throw new BillingRequestError(503, "billing-storage-unavailable");
    if (!subscription) throw new BillingRequestError(409, "billing-subscription-not-cancellable");
    if (subscription.cancel_at_period_end && canCancelBillingRecurrence({
      billingCycle: subscription.billing_cycle,
      status: subscription.status,
      providerSubscriptionId: subscription.provider_subscription_id,
      cancelAtPeriodEnd: false,
    })) {
      return Response.json({ ok: true, alreadyCanceled: true }, { headers: { "Cache-Control": "no-store" } });
    }
    if (!canCancelBillingRecurrence({
      billingCycle: subscription.billing_cycle,
      status: subscription.status,
      providerSubscriptionId: subscription.provider_subscription_id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })) {
      throw new BillingRequestError(409, "billing-subscription-not-cancellable");
    }

    await asaasDeleteSubscription(subscription.provider_subscription_id);
    const { data: updated, error: updateError } = await admin.from("graficalc_billing_subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId).eq("provider_subscription_id", subscription.provider_subscription_id)
      .select("tenant_id").maybeSingle();
    if (updateError) throw new BillingRequestError(503, "billing-cancellation-sync-pending");
    if (!updated) throw new BillingRequestError(409, "billing-subscription-changed");

    return Response.json({ ok: true, alreadyCanceled: false }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return billingResponseError(error); }
}
