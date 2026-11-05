import { billingResponseError, requireBillingOwner } from "@/lib/billing/server";
import { validatedCheckoutUrl } from "@/lib/billing/catalog";
import { canCancelBillingRecurrence } from "@/lib/billing/cancellation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { admin, tenantId } = await requireBillingOwner();
    const [{ data: subscription, error: subscriptionError }, { data: payments, error: paymentsError }] = await Promise.all([
      admin.from("graficalc_billing_subscriptions")
        .select("plan_key,plan_name,billing_cycle,amount_cents,status,trial_started_at,trial_ends_at,current_period_start,current_period_end,grace_days,cancel_at_period_end,canceled_at,updated_at,provider_subscription_id")
        .eq("tenant_id", tenantId).maybeSingle(),
      admin.from("graficalc_billing_payments")
        .select("provider_payment_id,amount_cents,status,due_at,paid_at,invoice_url,created_at")
        .eq("tenant_id", tenantId).order("created_at", { ascending: false }).limit(50),
    ]);
    if (subscriptionError || paymentsError) throw new Error("billing-storage-unavailable");
    const { data: openCheckout, error: checkoutError } = await admin.from("graficalc_billing_checkouts")
      .select("plan_key,plan_name,billing_cycle,amount_cents,status,provider_checkout_id,checkout_url,expires_at,created_at")
      .eq("tenant_id", tenantId).in("status", ["creating", "pending"])
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (checkoutError) throw new Error("billing-storage-unavailable");
    let safeOpenCheckout = null;
    if (openCheckout?.provider_checkout_id && openCheckout.checkout_url) {
      try { safeOpenCheckout = { ...openCheckout, checkout_url: validatedCheckoutUrl({ id: openCheckout.provider_checkout_id, link: openCheckout.checkout_url }).url }; }
      catch { safeOpenCheckout = null; }
    }
    const subscriptionView = subscription ? (() => {
      const { provider_subscription_id: providerSubscriptionId, ...publicSubscription } = subscription;
      return {
        ...publicSubscription,
        canCancelRecurrence: canCancelBillingRecurrence({
          billingCycle: subscription.billing_cycle,
          status: subscription.status,
          providerSubscriptionId,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }),
      };
    })() : null;
    return Response.json({ ok: true, subscription: subscriptionView, payments: payments || [], openCheckout: safeOpenCheckout }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) { return billingResponseError(error); }
}
