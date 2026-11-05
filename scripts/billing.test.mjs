import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  BillingConfigError,
  billingConfig,
  buildCheckoutPayload,
  isStrongSecret,
  isStrongWebhookSecret,
  parseBillingPlans,
  validWebhookToken,
  validatedCheckoutUrl,
} from "../lib/billing/catalog.ts";
import { deriveBillingAccess } from "../lib/billing/entitlement.ts";
import { canCancelBillingRecurrence } from "../lib/billing/cancellation.ts";
import { AsaasProviderError, deleteSandboxSubscription } from "../lib/billing/asaas-provider.ts";
import { paymentStateForEvent, resolveBillingTenantId, resolvePaymentState, shouldApplyPaymentToSubscription } from "../lib/billing/events.ts";
import { isKnownAsaasEvent, sanitizeAsaasEvent } from "../lib/billing/webhook-sanitize.mjs";
import { isBillingSameOrigin } from "../lib/billing/origin.ts";
import { showWorkspaceReturnLink } from "../lib/billing/navigation.ts";
import { summarizeBillingDates } from "../lib/billing/presentation.ts";
import { readRequestTextLimited, RequestBodyTooLargeError } from "../lib/http/request-body.ts";
import { readResponseTextLimited, ResponseBodyTooLargeError } from "../lib/http/response-body.mjs";

const baseEnv = {
  GRAFICALC_BILLING_ENABLED: "true",
  GRAFICALC_ASAAS_ENVIRONMENT: "sandbox",
  GRAFICALC_ASAAS_API_KEY: "sandbox-key-test",
  GRAFICALC_ASAAS_WEBHOOK_TOKEN: "k7V!q2M@z5P#c8R$u1N^x4B&d9J*e6F!h3T@P6",
  GRAFICALC_BILLING_PLANS_JSON: JSON.stringify([
    { key: "monthly", name: "Mensal", description: "Plano mensal", amountCents: 12345, cycle: "monthly", trialDays: 0, graceDays: 0 },
    { key: "annual", name: "Anual", description: "Plano anual", amountCents: 123456, cycle: "annual", trialDays: 0, graceDays: 0 },
  ]),
  NEXT_PUBLIC_SITE_URL: "https://graficalc.com.br",
};
const migration = await readFile(new URL("../supabase/06_graficalc_billing.sql", import.meta.url), "utf8");

test("billing catalog reads server-configured amounts and rejects malformed prices", () => {
  const [monthly, annual] = parseBillingPlans(baseEnv.GRAFICALC_BILLING_PLANS_JSON);
  assert.equal(monthly.amountCents, 12345);
  assert.equal(annual.amountCents, 123456);
  assert.throws(() => parseBillingPlans(JSON.stringify([{ key: "bad", name: "Plano", cycle: "monthly", amountCents: 0 }])), BillingConfigError);
  assert.throws(() => parseBillingPlans(JSON.stringify([
    { key: "same", name: "A", cycle: "monthly", amountCents: 100 },
    { key: "same", name: "B", cycle: "annual", amountCents: 200 },
  ])), /billing-plan-duplicate/);
});

test("billing stays off until explicitly enabled and cannot select a production Asaas endpoint", () => {
  assert.throws(() => billingConfig({ ...baseEnv, GRAFICALC_BILLING_ENABLED: "false" }), /billing-disabled/);
  assert.throws(() => billingConfig({ ...baseEnv, GRAFICALC_ASAAS_ENVIRONMENT: "production" }), /billing-production-blocked/);
  assert.equal(billingConfig(baseEnv).apiUrl, "https://api-sandbox.asaas.com/v3");
  assert.throws(() => billingConfig({ ...baseEnv, GRAFICALC_BILLING_PLANS_JSON: "[]" }), /billing-plans-not-configured/);
  assert.equal(isStrongWebhookSecret("a".repeat(32)), false);
  assert.equal(isStrongWebhookSecret("k7V!q2M@z5P#c8R$u1N^x4B&d9J*e6F!h3T@P6"), true);
  assert.equal(isStrongWebhookSecret("0123456789abcdef0123456789abcdef"), false, "predictable sequences are rejected");
  assert.equal(isStrongWebhookSecret("A!".repeat(128)), false);
  assert.equal(isStrongWebhookSecret(`${"xY7!".repeat(64)}Z`), false, "Asaas token length limit is enforced");
});

test("checkout payload uses only its server plan snapshot and has fixed internal callbacks", () => {
  const [monthly, annual] = parseBillingPlans(baseEnv.GRAFICALC_BILLING_PLANS_JSON);
  const monthlyPayload = buildCheckoutPayload(monthly, "00000000-0000-4000-8000-000000000001", "https://graficalc.com.br", "2026-11-10");
  const annualPayload = buildCheckoutPayload(annual, "00000000-0000-4000-8000-000000000002", "https://graficalc.com.br", "2026-11-10");
  assert.equal(monthlyPayload.items[0].value, 123.45);
  assert.deepEqual(monthlyPayload.chargeTypes, ["RECURRENT"]);
  assert.equal(monthlyPayload.subscription.cycle, "MONTHLY");
  assert.equal(annualPayload.items[0].value, 1234.56);
  assert.deepEqual(annualPayload.chargeTypes, ["DETACHED"]);
  assert.equal("subscription" in annualPayload, false);
  assert.equal(monthlyPayload.callback.successUrl, "https://graficalc.com.br/assinatura?billing=return");
  assert.throws(() => buildCheckoutPayload(monthly, "not-a-uuid", "https://graficalc.com.br", "2026-11-10"), /invalid-external-reference/);
});

test("checkout redirect accepts only the Asaas Sandbox host", () => {
  const checkout = { id: "00000000-0000-4000-8000-000000000001", link: "https://sandbox.asaas.com/checkoutSession/show?id=test" };
  assert.equal(validatedCheckoutUrl(checkout).url, checkout.link);
  assert.match(validatedCheckoutUrl({ id: checkout.id }).url, /^https:\/\/sandbox\.asaas\.com\//);
  assert.throws(() => validatedCheckoutUrl({ id: checkout.id, link: "https://attacker.example/pay" }), /asaas-checkout-url-invalid/);
  assert.throws(() => validatedCheckoutUrl({ id: checkout.id, link: "https://evil.sandbox.asaas.com/checkoutSession/show?id=test" }), /asaas-checkout-url-invalid/);
  assert.throws(() => validatedCheckoutUrl({ id: checkout.id, link: "https://user@sandbox.asaas.com/checkoutSession/show?id=test" }), /asaas-checkout-url-invalid/);
  assert.throws(() => validatedCheckoutUrl({ id: checkout.id, link: "https://sandbox.asaas.com:444/checkoutSession/show?id=test" }), /asaas-checkout-url-invalid/);
  assert.throws(() => validatedCheckoutUrl({ id: "bad", link: checkout.link }), /asaas-checkout-response-invalid/);
});

test("webhook token comparison requires a non-empty exact match", () => {
  const expected = baseEnv.GRAFICALC_ASAAS_WEBHOOK_TOKEN;
  assert.equal(validWebhookToken(expected, expected), true);
  assert.equal(validWebhookToken("", expected), false);
  assert.equal(validWebhookToken(`${expected}x`, expected), false);
  assert.equal(validWebhookToken("different-token-value-that-is-long-enough-123", expected), false);
});

test("cron secret rejects weak values before the worker can drain the queue", () => {
  assert.equal(isStrongSecret(baseEnv.GRAFICALC_ASAAS_WEBHOOK_TOKEN), true);
  assert.equal(isStrongSecret("x".repeat(64)), false);
  assert.equal(isStrongSecret("0123456789abcdef0123456789abcdef"), false);
  assert.equal(isStrongSecret("short"), false);
  assert.equal(isStrongSecret(`${"Ab7!".repeat(8)}é`), false, "non-ASCII secrets are rejected for predictable HTTP header handling");
});

test("billing request bodies are capped while streaming, including chunked bodies without a length header", async () => {
  const exactLimit = new Request("https://graficalc.com.br/api/billing/checkout", {
    method: "POST", body: new TextEncoder().encode("ábc"),
  });
  assert.equal(await readRequestTextLimited(exactLimit, 4), "ábc", "limits count UTF-8 bytes");

  let canceled = false;
  const oversized = new Request("https://graficalc.com.br/api/billing/webhook", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(800_000));
        controller.enqueue(new Uint8Array(300_000));
      },
      cancel() { canceled = true; },
    }),
    // Deliberately omit Content-Length: the stream itself must enforce the cap.
    duplex: "half",
  });
  await assert.rejects(readRequestTextLimited(oversized, 1_048_576), RequestBodyTooLargeError);
  assert.equal(canceled, true, "reading stops as soon as the stream exceeds the limit");

  const malformedUtf8 = new Request("https://graficalc.com.br/api/billing/checkout", {
    method: "POST", body: new Uint8Array([0xc3, 0x28]),
  });
  await assert.rejects(readRequestTextLimited(malformedUtf8, 8), TypeError);
});

test("Asaas responses are capped while streaming and reject invalid UTF-8", async () => {
  const valid = new Response(JSON.stringify({ id: "checkout-1", value: 123.45 }));
  assert.deepEqual(JSON.parse(await readResponseTextLimited(valid, 128)), { id: "checkout-1", value: 123.45 });
  let canceled = false;
  const oversized = new Response(new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(40_000)); controller.enqueue(new Uint8Array(40_000)); },
    cancel() { canceled = true; },
  }));
  await assert.rejects(readResponseTextLimited(oversized, 65_536), ResponseBodyTooLargeError);
  assert.equal(canceled, true, "reading stops as soon as the provider response exceeds the limit");
  await assert.rejects(
    readResponseTextLimited(new Response("12345", { headers: { "content-length": "5" } }), 4),
    ResponseBodyTooLargeError,
  );
  await assert.rejects(readResponseTextLimited(new Response(new Uint8Array([0xc3, 0x28])), 8), TypeError);
});

test("webhook queue stores only the fields required for billing and drops payer PII", () => {
  const saved = sanitizeAsaasEvent("PAYMENT_RECEIVED", {
    id: "evt-1", event: "PAYMENT_RECEIVED", dateCreated: "2026-11-04 12:00:00",
    payment: {
      id: "pay-1", externalReference: "checkout-ref", subscription: "sub-1", value: 99.9,
      paymentDate: "2026-11-04", customer: "cus-1", billingType: "CREDIT_CARD",
      description: "payer-specific memo", invoiceUrl: "https://www.asaas.com/i/1", creditCard: { number: "411111******1111" },
    },
  });
  assert.deepEqual(saved, {
    dateCreated: "2026-11-04 12:00:00",
    payment: {
      id: "pay-1", externalReference: "checkout-ref", subscription: "sub-1", value: 99.9,
      paymentDate: "2026-11-04", confirmedDate: null, dateCreated: null, dueDate: null,
      invoiceUrl: "https://www.asaas.com/i/1",
    },
  });
  const checkout = sanitizeAsaasEvent("CHECKOUT_PAID", {
    dateCreated: "2026-11-04 12:00:00",
    checkout: { id: "co-1", customer: "cus-1", customerData: { name: "pessoa" }, items: [{ name: "nome", value: 10, quantity: 1 }] },
  });
  assert.deepEqual(checkout, {
    dateCreated: "2026-11-04 12:00:00",
    checkout: { id: "co-1", items: [{ value: 10, quantity: 1 }], customer: "cus-1", subscription: { id: null } },
  });
  const malformed = sanitizeAsaasEvent("PAYMENT_RECEIVED", {
    payment: { id: "pay-2", value: { leaked: "private data" }, customer: { name: "pessoa" } },
  });
  assert.equal(malformed.payment.value, null, "untrusted nested data is not persisted as an amount");
  assert.equal("customer" in malformed.payment, false);
  assert.equal(isKnownAsaasEvent("PAYMENT_RECEIVED"), true);
  assert.equal(isKnownAsaasEvent("API_KEY_CREATED"), false);
});

test("payment webhook transitions do not confuse restored charges with paid invoices", () => {
  assert.equal(paymentStateForEvent("PAYMENT_RESTORED"), "pending");
  assert.equal(paymentStateForEvent("PAYMENT_CONFIRMED"), "paid");
  assert.equal(paymentStateForEvent("PAYMENT_RECEIVED"), "paid");
  assert.equal(paymentStateForEvent("PAYMENT_REFUND_IN_PROGRESS"), "review");
  assert.equal(paymentStateForEvent("PAYMENT_REFUND_DENIED"), "paid");
  assert.equal(paymentStateForEvent("PAYMENT_REPROVED_BY_RISK_ANALYSIS"), "canceled");
  assert.equal(resolvePaymentState("PAYMENT_RESTORED", "canceled", false), "pending");
  assert.equal(resolvePaymentState("PAYMENT_CREATED", "paid", false), "paid");
  assert.equal(resolvePaymentState("PAYMENT_CONFIRMED", "pending", true), "review");
  assert.equal(resolvePaymentState("PAYMENT_CONFIRMED", "refunded", false), "refunded");
  assert.equal(resolvePaymentState("PAYMENT_CONFIRMED", "review", false), "paid");
  assert.equal(resolvePaymentState("PAYMENT_REFUND_DENIED", "review", false), "paid");
  assert.equal(resolvePaymentState("PAYMENT_REFUND_DENIED", "refunded", false), "paid");
  assert.equal(resolvePaymentState("PAYMENT_REFUND_DENIED", "refunded", true), "review");
  assert.equal(resolvePaymentState("PAYMENT_UPDATED", "review", false), "review");
  assert.equal(resolvePaymentState("PAYMENT_OVERDUE", "overdue", false), "overdue");
});

test("payment webhook refuses to cross-link a checkout and subscription from different tenants", () => {
  assert.equal(resolveBillingTenantId("tenant-a", "tenant-a"), "tenant-a");
  assert.equal(resolveBillingTenantId("tenant-a", null), "tenant-a");
  assert.equal(resolveBillingTenantId(null, "tenant-b"), "tenant-b");
  assert.equal(resolveBillingTenantId(null, null), null);
  assert.throws(() => resolveBillingTenantId("tenant-a", "tenant-b"), /billing-tenant-mismatch/);
});

test("checkout same-origin validation compares scheme and host and rejects malformed origins", () => {
  assert.equal(isBillingSameOrigin("https://graficalc.com.br", "graficalc.com.br", "https", "https://internal.invalid/api"), true);
  assert.equal(isBillingSameOrigin("http://graficalc.com.br", "graficalc.com.br", "https", "https://internal.invalid/api"), false);
  assert.equal(isBillingSameOrigin("https://evil.example", "graficalc.com.br", "https", "https://internal.invalid/api"), false);
  assert.equal(isBillingSameOrigin("https://graficalc.com.br/path", "graficalc.com.br", "https", "https://internal.invalid/api"), false);
  assert.equal(isBillingSameOrigin("not-an-origin", "graficalc.com.br", "https", "https://internal.invalid/api"), false);
  assert.equal(isBillingSameOrigin("http://localhost:3210", "localhost:3210", null, "http://localhost:3210/api"), true);
  assert.equal(isBillingSameOrigin("https://graficalc.com.br", "graficalc.com.br", "https,http", "https://internal.invalid/api"), false);
});

test("historical settled payment webhooks update payment history without changing current entitlement", async () => {
  const oldPaidAt = "2026-10-01T12:00:00.000Z";
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "paid", paymentId: "payment-old", lastPaymentId: "payment-current", priorPaidAt: oldPaidAt }), false);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "refunded", paymentId: "payment-old", lastPaymentId: "payment-current", priorPaidAt: oldPaidAt }), false);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "paid", paymentId: "payment-current", lastPaymentId: "payment-current", priorPaidAt: oldPaidAt }), true);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "paid", paymentId: "payment-new", lastPaymentId: "payment-current", priorPaidAt: null }), true);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "paid", paymentId: "payment-old-unseen", lastPaymentId: "payment-current", priorPaidAt: null, paymentAt: "2026-10-01T00:00:00Z", lastPaymentAt: "2026-10-04T00:00:00Z" }), false);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "refunded", paymentId: "payment-old-unseen", lastPaymentId: "payment-current", priorPaidAt: null, paymentAt: "2026-10-01T00:00:00Z", lastPaymentAt: "2026-10-04T00:00:00Z" }), false);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "paid", paymentId: "payment-new", lastPaymentId: "payment-current", priorPaidAt: null, paymentAt: "2026-10-05T00:00:00Z", lastPaymentAt: "2026-10-04T00:00:00Z" }), true);
  assert.equal(shouldApplyPaymentToSubscription({ nextState: "review", paymentId: "payment-old", lastPaymentId: "payment-current", priorPaidAt: oldPaidAt }), true);
  const processor = await readFile(new URL("../lib/billing/webhook-processor.ts", import.meta.url), "utf8");
  assert.match(processor, /rpc\("graficalc_apply_billing_payment_event"/);
  assert.doesNotMatch(processor, /from\("graficalc_billing_payments"\)\.upsert/);
  assert.match(migration, /v_historical_payment := \(v_prior_paid_at is not null[\s\S]*?v_subscription\.last_payment_id is distinct from p_provider_payment_id/);
  assert.match(migration, /v_subscription\.last_payment_id is distinct from p_provider_payment_id\s+and v_payment_at < v_subscription\.last_payment_at/);
  assert.match(migration, /paid_at = case when excluded\.status = 'paid'[\s\S]*?coalesce\(saved_payment\.paid_at, excluded\.paid_at\)/);
  assert.match(migration, /v_prior_tenant_id <> p_tenant_id/);
  assert.match(migration, /billing_provider_subscription_mismatch/);
});

test("entitlement preserves existing tenants and enforces trial, payment, and grace deadlines", () => {
  const now = new Date("2026-11-04T12:00:00.000Z");
  assert.equal(deriveBillingAccess({ status: "legacy_access" }, now).allowed, true);
  assert.equal(deriveBillingAccess({ status: "trialing", trial_ends_at: "2026-11-05T12:00:00.000Z" }, now).allowed, true);
  assert.equal(deriveBillingAccess({ status: "trialing", trial_ends_at: "2026-11-04T12:00:00.000Z" }, now).allowed, false);
  assert.equal(deriveBillingAccess({ status: "canceled", trial_ends_at: "2026-11-05T12:00:00.000Z" }, now).allowed, true, "canceling a recurring trial preserves access through its original end");
  assert.equal(deriveBillingAccess({ status: "canceled", trial_ends_at: "2026-11-03T12:00:00.000Z" }, now).allowed, false);
  assert.equal(deriveBillingAccess({ status: "active", current_period_end: "2026-11-05T12:00:00.000Z" }, now).allowed, true);
  assert.equal(deriveBillingAccess({ status: "canceled", current_period_end: "2026-11-05T12:00:00.000Z" }, now).allowed, true);
  assert.equal(deriveBillingAccess({ status: "canceled", current_period_end: "2026-11-03T12:00:00.000Z" }, now).allowed, false);
  assert.equal(deriveBillingAccess({ status: "pending" }, now).allowed, false);
  assert.equal(deriveBillingAccess({ status: "past_due", current_period_end: "2026-11-01T12:00:00.000Z", grace_days: 5 }, now).allowed, true);
  assert.equal(deriveBillingAccess({ status: "past_due", current_period_end: "2026-11-01T12:00:00.000Z", grace_days: 2 }, now).allowed, false);
  assert.equal(deriveBillingAccess({ status: "past_due", current_period_end: "2026-11-04T12:00:00.000Z", grace_days: 0 }, now).allowed, false);
  assert.equal(deriveBillingAccess(null, now).reason, "subscription-required");
});

test("only an active monthly Asaas recurrence can be canceled", () => {
  const recurrence = { billingCycle: "monthly", status: "active", providerSubscriptionId: "sub_VXJBYgP2u0eO", cancelAtPeriodEnd: false };
  assert.equal(canCancelBillingRecurrence(recurrence), true);
  assert.equal(canCancelBillingRecurrence({ ...recurrence, status: "trialing" }), true);
  assert.equal(canCancelBillingRecurrence({ ...recurrence, status: "expired" }), false);
  assert.equal(canCancelBillingRecurrence({ ...recurrence, billingCycle: "annual" }), false);
  assert.equal(canCancelBillingRecurrence({ ...recurrence, providerSubscriptionId: "https://attacker.example" }), false);
  assert.equal(canCancelBillingRecurrence({ ...recurrence, cancelAtPeriodEnd: true }), false);
});

test("recurrence cancellation calls only the Asaas Sandbox endpoint and handles retries", async () => {
  let call;
  const fetcher = async (url, init) => {
    call = { url: String(url), init };
    return new Response(null, { status: 200 });
  };
  assert.deepEqual(await deleteSandboxSubscription("sub_VXJBYgP2u0eO", "test-api-key", fetcher), { alreadyRemoved: false });
  assert.equal(call.url, "https://api-sandbox.asaas.com/v3/subscriptions/sub_VXJBYgP2u0eO");
  assert.equal(call.init.method, "DELETE");
  assert.equal(call.init.headers.access_token, "test-api-key");
  assert.deepEqual(await deleteSandboxSubscription("sub_VXJBYgP2u0eO", "test-api-key", async () => new Response(null, { status: 404 })), { alreadyRemoved: true });
  await assert.rejects(deleteSandboxSubscription("https://asaas.com/subscription", "test-api-key", fetcher), AsaasProviderError);
  await assert.rejects(deleteSandboxSubscription("sub_VXJBYgP2u0eO", "test-api-key", async () => new Response(null, { status: 503 })), /billing-provider-unavailable/);
});

test("restricted subscription access cannot navigate back into the workspace redirect loop", () => {
  assert.equal(showWorkspaceReturnLink("restrito"), false);
  assert.equal(showWorkspaceReturnLink(["restrito", "outro"]), false);
  assert.equal(showWorkspaceReturnLink(""), true);
  assert.equal(showWorkspaceReturnLink(undefined), true);
});

test("subscription summary identifies latest paid date and uses the right period label", () => {
  const payments = [
    { status: "paid", paid_at: "2026-10-18T12:00:00.000Z" },
    { status: "pending", paid_at: null },
    { status: "paid", paid_at: "2026-10-25T12:00:00.000Z" },
  ];
  const monthly = summarizeBillingDates({ billing_cycle: "monthly", status: "active", current_period_end: "2026-11-25T12:00:00.000Z" }, payments);
  assert.equal(monthly.lastPaymentAt, "2026-10-25T12:00:00.000Z");
  assert.equal(monthly.periodLabel, "Próximo vencimento");
  assert.equal(monthly.periodEndAt, "2026-11-25T12:00:00.000Z");
  assert.equal(summarizeBillingDates({ billing_cycle: "annual", status: "active", current_period_end: null }, payments).periodLabel, "Acesso até");
  assert.equal(summarizeBillingDates({ billing_cycle: "monthly", status: "canceled", current_period_end: null }, payments).periodLabel, "Acesso até");
  assert.equal(summarizeBillingDates({ billing_cycle: "monthly", status: "past_due", current_period_end: null }, []).periodLabel, "Vencimento pendente");
  assert.equal(summarizeBillingDates(null, []).lastPaymentAt, null);
});

test("billing routes keep checkout, account data, and webhook responses private and uncached", async () => {
  const [checkout, account, plans, webhook, processor, worker, vercelConfig, cancellation] = await Promise.all([
    readFile(new URL("../app/api/billing/checkout/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/account/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/plans/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/webhook/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/billing/webhook-processor.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/worker/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../vercel.json", import.meta.url), "utf8"),
    readFile(new URL("../app/api/billing/cancel/route.ts", import.meta.url), "utf8"),
  ]);
  const billingServer = await readFile(new URL("../lib/billing/server.ts", import.meta.url), "utf8");
  assert.match(billingServer, /readResponseTextLimited\(response, 65_536\)/);
  assert.match(checkout, /requireBillingOwner\(\)/);
  assert.match(checkout, /buildCheckoutPayload\(effectivePlan,/);
  assert.match(checkout, /billing-provider-rejected-request/);
  assert.match(checkout, /deriveBillingAccess\(currentSubscription\)/);
  assert.match(checkout, /trial_started_at/);
  assert.match(checkout, /trial-already-used/);
  assert.match(checkout, /effectiveTrialDays/);
  assert.match(plans, /trial_started_at/);
  assert.match(plans, /trialConfiguredDays/);
  assert.match(billingServer, /request\.headers\.get\("host"\)/);
  assert.match(billingServer, /request\.headers\.get\("x-forwarded-proto"\)/);
  assert.doesNotMatch(billingServer, /x-forwarded-host/);
  assert.match(billingServer, /response\.status >= 500/);
  assert.match(billingServer, /deleteSandboxSubscription\(subscriptionId, key, fetcher\)/);
  assert.match(account, /Cache-Control.*private, no-store/);
  assert.match(account, /canCancelBillingRecurrence/);
  assert.match(account, /provider_subscription_id: providerSubscriptionId/);
  assert.match(cancellation, /assertBillingSameOrigin\(request\)/);
  assert.match(cancellation, /requireBillingOwner\(\)/);
  assert.match(cancellation, /asaasDeleteSubscription\(subscription\.provider_subscription_id\)/);
  assert.match(cancellation, /cancel_at_period_end: true/);
  assert.match(cancellation, /eq\("provider_subscription_id", subscription\.provider_subscription_id\)/);
  assert.match(webhook, /asaas-access-token/);
  assert.match(webhook, /onConflict: "provider_event_id"/);
  assert.match(webhook, /after\(async \(\) => \{ await drainBillingWebhookQueue/);
  assert.match(webhook, /payload: knownEvent \? sanitizeAsaasEvent/);
  assert.match(webhook, /readRequestTextLimited\(request, 1_048_576\)/);
  assert.match(checkout, /readRequestTextLimited\(request, 8192\)/);
  assert.match(processor, /SUBSCRIPTION_CREATED/);
  assert.match(processor, /SUBSCRIPTION_INACTIVATED/);
  assert.match(processor, /PAYMENT_RESTORED/);
  assert.match(processor, /PAYMENT_RECEIVED_IN_CASH_UNDONE/);
  assert.match(processor, /rpc\("graficalc_apply_billing_payment_event"/);
  assert.match(processor, /rpc\("graficalc_apply_billing_checkout_event"/);
  assert.match(processor, /rpc\("graficalc_apply_billing_subscription_event"/);
  assert.match(processor, /from\("graficalc_billing_provider_subscriptions"\)/);
  assert.match(processor, /paymentStateForEvent\(eventType\)/);
  assert.match(processor, /payment\.paymentDate \|\| payment\.confirmedDate \|\| payment\.dateCreated \|\| payload\.dateCreated/);
  assert.doesNotMatch(processor, /from\("graficalc_billing_payments"\)\.upsert/);
  const checkoutProcessor = processor.slice(processor.indexOf("async function processCheckoutEvent"), processor.indexOf("async function processSubscriptionEvent"));
  assert.doesNotMatch(checkoutProcessor, /from\("graficalc_(billing_checkouts|billing_subscriptions)"\)\.(update|upsert)/);
  const subscriptionProcessor = processor.slice(processor.indexOf("async function processSubscriptionEvent"), processor.indexOf("async function processPaymentEvent"));
  assert.doesNotMatch(subscriptionProcessor, /from\("graficalc_billing_subscriptions"\)\.update/);
  assert.match(processor, /resolveBillingTenantId\(savedCheckout\?\.tenant_id, subscription\?\.tenant_id\)/);
  assert.match(worker, /CRON_SECRET/);
  assert.match(worker, /isStrongSecret\(secret\)/);
  assert.match(worker, /drainBillingWebhookQueue\(createAdminClient\(\), 25\)/);
  assert.match(vercelConfig, /"path": "\/api\/billing\/worker"/);
  assert.match(vercelConfig, /"schedule": "\* \* \* \* \*"/);
  const subscriptionPanel = await readFile(new URL("../components/billing/subscription-panel.tsx", import.meta.url), "utf8");
  assert.match(subscriptionPanel, /api\/billing\/cancel/);
  assert.match(subscriptionPanel, /subscription\?\.canCancelRecurrence/);
  assert.match(subscriptionPanel, /Promise\.allSettled\(/);
  assert.match(subscriptionPanel, /setSubscription\(accountResult\.value\.subscription\)/);
  assert.match(subscriptionPanel, /Os dados da assinatura foram carregados, mas os planos ainda não estão configurados/);
  assert.match(subscriptionPanel, /cobranças pendentes ou vencidas/);
  assert.match(subscriptionPanel, /disabled=\{Boolean\(submittingPlan\) \|\| existingAccess\}/);
  assert.match(subscriptionPanel, /Contratar plano \$\{plan\.name\}/);
  assert.match(subscriptionPanel, /Preparando checkout do plano \$\{plan\.name\}/);
  assert.match(subscriptionPanel, /renovação automática no cartão/);
  assert.match(subscriptionPanel, /pagamento avulso, sem renovação automática/);
  assert.match(subscriptionPanel, /aria-busy=\{loading\}/);
  assert.doesNotMatch(webhook + processor + worker, /console\.(log|error)\(/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.graficalc_billing_events from public, anon, authenticated/);
  assert.match(migration, /provider_event_id text not null unique/);
  assert.match(migration, /payload jsonb/);
  assert.match(migration, /create or replace function public\.graficalc_claim_billing_events/);
  assert.match(migration, /for update skip locked/);
  assert.match(migration, /revoke all on function public\.graficalc_claim_billing_events[\s\S]*?from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.graficalc_claim_billing_events[\s\S]*?to service_role/);
  assert.match(migration, /graficalc_claim_billing_checkout/);
  assert.match(migration, /if p_trial_days > 0 and v_trial_started_at is not null then[\s\S]*?action', 'trial-used'/);
  assert.match(migration, /create or replace function public\.graficalc_apply_billing_payment_event/);
  assert.match(migration, /select \* into v_subscription[\s\S]*?for update/);
  assert.match(migration, /security invoker[\s\S]*?set search_path = ''/);
  assert.match(migration, /revoke all on function public\.graficalc_apply_billing_payment_event[\s\S]*?from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.graficalc_apply_billing_payment_event[\s\S]*?to service_role/);
  assert.match(migration, /create or replace function public\.graficalc_apply_billing_checkout_event/);
  assert.match(migration, /cancel_at_period_end = false,[\s\S]*?canceled_at = null/);
  assert.match(migration, /select \* into v_subscription[\s\S]*?for update;[\s\S]*?select \* into v_checkout[\s\S]*?for update;/);
  assert.match(migration, /revoke all on function public\.graficalc_apply_billing_checkout_event[\s\S]*?from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.graficalc_apply_billing_checkout_event[\s\S]*?to service_role/);
  assert.match(migration, /add column if not exists provider_subscription_event_at timestamptz/);
  assert.match(migration, /create or replace function public\.graficalc_apply_billing_subscription_event/);
  assert.match(migration, /provider_subscription_event_at is not null[\s\S]*?p_event_at <= v_subscription\.provider_subscription_event_at[\s\S]*?stale_subscription_event/);
  assert.match(migration, /revoke all on function public\.graficalc_apply_billing_subscription_event[\s\S]*?from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.graficalc_apply_billing_subscription_event[\s\S]*?to service_role/);
  assert.match(migration, /create table if not exists public\.graficalc_billing_provider_subscriptions/);
  assert.match(migration, /revoke all on public\.graficalc_billing_provider_subscriptions from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update on public\.graficalc_billing_provider_subscriptions to service_role/);
  assert.doesNotMatch(migration, /grant [^;]*delete on public\.graficalc_billing_provider_subscriptions to service_role/);
  assert.match(migration, /billing_provider_subscription_checkout_mismatch/);
  assert.match(migration, /superseded_provider_subscription/);
  assert.match(migration, /v_historical_payment := \(v_prior_paid_at is not null[\s\S]*?provider_subscription_id <> p_provider_subscription_id/);
  assert.match(migration, /or v_subscription\.status in \('pending', 'expired', 'refunded'\)/);
  assert.match(migration, /last_payment_id text/);
  assert.match(migration, /provider_customer_id text/);
  const sharedState = await readFile(new URL("../app/api/shared-state/route.ts", import.meta.url), "utf8");
  const sessionProxy = await readFile(new URL("../lib/supabase/proxy.ts", import.meta.url), "utf8");
  assert.match(sessionProxy, /PUBLIC_PATHS\s*=\s*\[[^\]]*"\/api\/billing\/worker"/);
  assert.equal((sharedState.match(/getBillingAccess\(/g) || []).length, 2);
  assert.match(sharedState, /status: 402/);
  assert.match(sessionProxy, /"\/api\/billing\/webhook"/);
});
