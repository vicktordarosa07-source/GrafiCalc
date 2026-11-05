import type { SupabaseClient } from "@supabase/supabase-js";
import { paymentStateForEvent, resolveBillingTenantId } from "@/lib/billing/events";
import { isKnownAsaasEvent } from "./webhook-sanitize.mjs";

export type StoredAsaasEvent = {
  provider_event_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  attempt_count: number;
};

type AsaasEvent = {
  id?: unknown;
  event?: unknown;
  dateCreated?: unknown;
  checkout?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
};

const checkoutEvents = new Set(["CHECKOUT_PAID", "CHECKOUT_CANCELED", "CHECKOUT_EXPIRED"]);
const paymentEvents = new Set([
  "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_AUTHORIZED",
  "PAYMENT_AWAITING_RISK_ANALYSIS", "PAYMENT_APPROVED_BY_RISK_ANALYSIS", "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_ANTICIPATED",
  "PAYMENT_RESTORED", "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_CANCELED", "PAYMENT_DELETED",
  "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_REFUND_DENIED", "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
]);
const subscriptionEvents = new Set(["SUBSCRIPTION_CREATED", "SUBSCRIPTION_UPDATED", "SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"]);

function eventTime(value: unknown): Date {
  const raw = String(value || "").trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00Z`
    : raw ? `${raw.replace(" ", "T")}${/[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? "" : "Z"}` : "";
  const date = normalized ? new Date(normalized) : null;
  if (!date || Number.isNaN(date.getTime())) throw new Error("billing-event-date-invalid");
  return date;
}

function safeInvoiceUrl(value: unknown) {
  const candidate = String(value || "");
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" && (url.hostname === "asaas.com" || url.hostname.endsWith(".asaas.com")) ? url.toString() : null;
  } catch { return null; }
}

async function processCheckoutEvent(admin: SupabaseClient, payload: AsaasEvent, eventType: string) {
  const checkout = payload.checkout || {};
  const checkoutId = String(checkout.id || "");
  if (!checkoutId) throw new Error("billing-checkout-id-missing");
  const items = Array.isArray(checkout.items) ? checkout.items as Array<Record<string, unknown>> : [];
  let itemsValid = items.length > 0;
  let totalCents = 0;
  for (const item of items) {
    const amount = Number(item.value);
    const quantity = Number(item.quantity);
    const itemCents = Math.round(amount * 100);
    if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(quantity) || quantity < 1
      || !Number.isSafeInteger(itemCents) || !Number.isSafeInteger(totalCents + itemCents * quantity)) {
      itemsValid = false;
      continue;
    }
    totalCents += itemCents * quantity;
  }
  const subscription = checkout.subscription && typeof checkout.subscription === "object"
    ? checkout.subscription as Record<string, unknown> : {};
  const { error } = await admin.rpc("graficalc_apply_billing_checkout_event", {
    p_provider_checkout_id: checkoutId,
    p_event_type: eventType,
    p_event_at: eventTime(payload.dateCreated).toISOString(),
    p_items_valid: itemsValid,
    p_total_amount_cents: totalCents,
    p_provider_customer_id: String(checkout.customer || "") || null,
    p_provider_subscription_id: String(subscription.id || "") || null,
  });
  if (error) throw new Error("billing-checkout-transaction-failed");
}

async function processSubscriptionEvent(admin: SupabaseClient, payload: AsaasEvent, eventType: string) {
  const providerSubscription = payload.subscription || {};
  const subscriptionId = String(providerSubscription.id || "");
  if (!subscriptionId) throw new Error("billing-subscription-id-missing");
  const externalReference = String(providerSubscription.externalReference || "");
  const customerId = String(providerSubscription.customer || "");
  let subscription: Record<string, unknown> | null = null;
  let checkoutId: string | null = null;
  const byProviderId = await admin.from("graficalc_billing_provider_subscriptions").select("tenant_id")
    .eq("provider_subscription_id", subscriptionId).maybeSingle();
  if (byProviderId.error) throw new Error("billing-subscription-lookup-failed");
  if (byProviderId.data) subscription = byProviderId.data;
  if (!subscription && externalReference) {
    const { data: checkout, error } = await admin.from("graficalc_billing_checkouts").select("id,tenant_id")
      .eq("external_reference", externalReference).maybeSingle();
    if (error) throw new Error("billing-checkout-lookup-failed");
    if (checkout?.tenant_id) {
      checkoutId = String(checkout.id);
      const lookup = await admin.from("graficalc_billing_subscriptions").select("tenant_id,provider_subscription_id")
        .eq("tenant_id", checkout.tenant_id).maybeSingle();
      if (lookup.error) throw new Error("billing-subscription-lookup-failed");
      subscription = lookup.data;
    }
  }
  if (!subscription && customerId) {
    const { data, error } = await admin.from("graficalc_billing_subscriptions").select("tenant_id,provider_subscription_id")
      .eq("provider_customer_id", customerId).maybeSingle();
    if (error) throw new Error("billing-subscription-lookup-failed");
    subscription = data;
  }
  if (!subscription) return;
  if (!checkoutId && externalReference) {
    const { data: checkout, error } = await admin.from("graficalc_billing_checkouts").select("id")
      .eq("external_reference", externalReference).eq("tenant_id", subscription.tenant_id).maybeSingle();
    if (error) throw new Error("billing-checkout-lookup-failed");
    checkoutId = checkout?.id ? String(checkout.id) : null;
  }
  const { error } = await admin.rpc("graficalc_apply_billing_subscription_event", {
    p_tenant_id: subscription.tenant_id,
    p_provider_subscription_id: subscriptionId,
    p_checkout_id: checkoutId,
    p_event_type: eventType,
    p_event_at: eventTime(payload.dateCreated).toISOString(),
    p_provider_customer_id: customerId || null,
    p_provider_status: String(providerSubscription.status || "").toUpperCase() || null,
  });
  if (error) throw new Error("billing-subscription-transaction-failed");
}

async function processPaymentEvent(admin: SupabaseClient, payload: AsaasEvent, eventType: string) {
  const payment = payload.payment || {};
  const paymentId = String(payment.id || "");
  if (!paymentId) throw new Error("billing-payment-id-missing");
  const externalReference = String(payment.externalReference || "");
  const providerSubscriptionId = String(payment.subscription || "");
  let savedCheckout = null as Record<string, unknown> | null;
  if (externalReference) {
    const { data, error } = await admin.from("graficalc_billing_checkouts").select("*")
      .eq("external_reference", externalReference).maybeSingle();
    if (error) throw new Error("billing-checkout-lookup-failed");
    savedCheckout = data;
  }
  let subscription = null as Record<string, unknown> | null;
  if (providerSubscriptionId) {
    const { data: providerSubscription, error: providerSubscriptionError } = await admin.from("graficalc_billing_provider_subscriptions").select("tenant_id")
      .eq("provider_subscription_id", providerSubscriptionId).maybeSingle();
    if (providerSubscriptionError) throw new Error("billing-subscription-lookup-failed");
    if (providerSubscription?.tenant_id) {
      const { data, error } = await admin.from("graficalc_billing_subscriptions").select("*")
        .eq("tenant_id", providerSubscription.tenant_id).maybeSingle();
      if (error) throw new Error("billing-subscription-lookup-failed");
      subscription = data;
    }
  }
  const tenantId = resolveBillingTenantId(savedCheckout?.tenant_id, subscription?.tenant_id);
  if (!tenantId) return;
  const expectedCents = Number(savedCheckout?.amount_cents ?? subscription?.amount_cents ?? 0);
  const value = Number(payment.value);
  const actualCents = Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : -1;
  const amountMismatch = expectedCents > 0 && actualCents !== expectedCents;
  const date = eventTime(payment.paymentDate || payment.confirmedDate || payment.dateCreated || payload.dateCreated);
  const { error } = await admin.rpc("graficalc_apply_billing_payment_event", {
    p_tenant_id: tenantId,
    p_owner_id: savedCheckout?.user_id || null,
    p_checkout_id: savedCheckout?.id || null,
    p_provider_payment_id: paymentId,
    p_provider_subscription_id: providerSubscriptionId || null,
    p_amount_cents: actualCents < 0 ? 0 : actualCents,
    p_event_type: eventType,
    p_event_state: paymentStateForEvent(eventType),
    p_amount_mismatch: amountMismatch,
    p_due_at: payment.dueDate ? eventTime(payment.dueDate).toISOString() : null,
    p_payment_at: date.toISOString(),
    p_invoice_url: safeInvoiceUrl(payment.invoiceUrl),
    p_plan_key: savedCheckout?.plan_key || null,
    p_plan_name: savedCheckout?.plan_name || null,
    p_billing_cycle: savedCheckout?.billing_cycle || null,
    p_grace_days: savedCheckout ? Number(savedCheckout.grace_days) : null,
  });
  if (error) throw new Error("billing-payment-transaction-failed");
}

export async function processStoredAsaasEvent(admin: SupabaseClient, event: StoredAsaasEvent) {
  const payload = event.payload as AsaasEvent;
  if (checkoutEvents.has(event.event_type)) await processCheckoutEvent(admin, payload, event.event_type);
  else if (subscriptionEvents.has(event.event_type)) await processSubscriptionEvent(admin, payload, event.event_type);
  else if (paymentEvents.has(event.event_type)) await processPaymentEvent(admin, payload, event.event_type);
  else throw new Error("billing-event-type-unsupported");
}

export async function drainBillingWebhookQueue(admin: SupabaseClient, batchSize = 1) {
  const staleBefore = new Date(Date.now() - 120_000).toISOString();
  const { data: events, error } = await admin.rpc("graficalc_claim_billing_events", {
    p_limit: Math.max(1, Math.min(50, Math.trunc(batchSize))),
    p_stale_before: staleBefore,
  });
  if (error || !Array.isArray(events)) throw new Error("billing-event-claim-failed");

  let processed = 0;
  let failed = 0;
  for (const event of events as StoredAsaasEvent[]) {
    try {
      await processStoredAsaasEvent(admin, event);
      const { error: completeError } = await admin.from("graficalc_billing_events").update({
        status: "processed", payload: null, processed_at: new Date().toISOString(), processing_started_at: null,
      }).eq("provider_event_id", event.provider_event_id).eq("status", "processing").eq("attempt_count", event.attempt_count);
      if (completeError) throw new Error("billing-event-completion-failed");
      processed++;
    } catch {
      failed++;
      await admin.from("graficalc_billing_events").update({
        status: "failed", error_code: "processing-failed", processing_started_at: null,
      }).eq("provider_event_id", event.provider_event_id).eq("status", "processing").eq("attempt_count", event.attempt_count);
    }
  }
  return { claimed: events.length, processed, failed };
}
