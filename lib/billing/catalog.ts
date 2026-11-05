import { timingSafeEqual } from "node:crypto";
import { isStrongSecret as isStrongSecretValue } from "../security/secret-strength.cjs";

export type BillingCycle = "monthly" | "annual";
export type BillingPlan = {
  key: string;
  name: string;
  description: string;
  amountCents: number;
  cycle: BillingCycle;
  trialDays: number;
  graceDays: number;
};

export class BillingConfigError extends Error {
  constructor(message = "billing-not-configured") {
    super(message);
    this.name = "BillingConfigError";
  }
}

export function isStrongSecret(value: string) {
  return isStrongSecretValue(value);
}

export function isStrongWebhookSecret(value: string) {
  return isStrongSecret(value);
}

function parseWholeNumber(value: unknown, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum ? number : null;
}

export function parseBillingPlans(raw: string | undefined): BillingPlan[] {
  if (!raw?.trim()) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new BillingConfigError("billing-plan-json-invalid"); }
  if (!Array.isArray(parsed) || parsed.length > 10) throw new BillingConfigError("billing-plan-list-invalid");

  const plans = parsed.map((candidate: unknown) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new BillingConfigError("billing-plan-invalid");
    const item = candidate as Record<string, unknown>;
    const key = String(item.key || "").trim();
    const name = String(item.name || "").trim();
    const description = String(item.description || "").trim();
    const cycle = item.cycle;
    const amountCents = parseWholeNumber(item.amountCents, 1, 100_000_000);
    const trialDays = parseWholeNumber(item.trialDays ?? 0, 0, 365);
    const graceDays = parseWholeNumber(item.graceDays ?? 0, 0, 60);
    if (!/^[a-z0-9][a-z0-9_-]{0,39}$/i.test(key) || !name || name.length > 80 || description.length > 240
      || !["monthly", "annual"].includes(String(cycle)) || amountCents === null || trialDays === null || graceDays === null) {
      throw new BillingConfigError("billing-plan-invalid");
    }
    return { key, name, description, amountCents, cycle: cycle as BillingCycle, trialDays, graceDays };
  });
  if (new Set(plans.map((plan) => plan.key)).size !== plans.length) throw new BillingConfigError("billing-plan-duplicate");
  return plans;
}

export function billingSecrets(env: NodeJS.ProcessEnv = process.env) {
  if (env.GRAFICALC_BILLING_ENABLED !== "true") throw new BillingConfigError("billing-disabled");
  // The integration remains sandbox-only. There is intentionally no production API URL.
  if ((env.GRAFICALC_ASAAS_ENVIRONMENT || "sandbox").toLowerCase() !== "sandbox") {
    throw new BillingConfigError("billing-production-blocked");
  }
  const apiKey = String(env.GRAFICALC_ASAAS_API_KEY || "").trim();
  const webhookToken = String(env.GRAFICALC_ASAAS_WEBHOOK_TOKEN || "");
  if (!apiKey || !isStrongWebhookSecret(webhookToken) || webhookToken === apiKey) {
    throw new BillingConfigError("billing-credentials-incomplete");
  }
  const appUrl = String(env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(appUrl);
    if (parsedUrl.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(parsedUrl.hostname)) throw new Error("invalid-url");
  } catch { throw new BillingConfigError("billing-app-url-invalid"); }
  return { apiKey, webhookToken, appUrl, apiUrl: "https://api-sandbox.asaas.com/v3" } as const;
}

export function billingConfig(env: NodeJS.ProcessEnv = process.env) {
  const secrets = billingSecrets(env);
  const plans = parseBillingPlans(env.GRAFICALC_BILLING_PLANS_JSON);
  if (!plans.length) throw new BillingConfigError("billing-plans-not-configured");
  return { ...secrets, plans } as const;
}

export function buildCheckoutPayload(plan: BillingPlan, externalReference: string, appUrl: string, nextDueDate: string) {
  if (!/^[0-9a-f-]{36}$/i.test(externalReference)) throw new TypeError("invalid-external-reference");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDueDate)) throw new TypeError("invalid-next-due-date");
  const recurring = plan.cycle === "monthly";
  return {
    billingTypes: recurring ? ["CREDIT_CARD"] : ["CREDIT_CARD", "PIX"],
    chargeTypes: recurring ? ["RECURRENT"] : ["DETACHED"],
    minutesToExpire: 60,
    externalReference,
    callback: {
      successUrl: `${appUrl}/assinatura?billing=return`,
      cancelUrl: `${appUrl}/assinatura?billing=cancel`,
      expiredUrl: `${appUrl}/assinatura?billing=expired`,
    },
    items: [{
      name: `GrafiCalc ${plan.name}`,
      description: plan.description || `Assinatura ${plan.cycle === "monthly" ? "mensal" : "anual"} do GrafiCalc`,
      quantity: 1,
      value: plan.amountCents / 100,
    }],
    ...(recurring ? { subscription: { cycle: "MONTHLY", nextDueDate } } : {}),
  };
}

export function validatedCheckoutUrl(checkout: unknown) {
  const id = String((checkout as { id?: unknown } | null)?.id || "");
  const link = String((checkout as { link?: unknown } | null)?.link || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new BillingConfigError("asaas-checkout-response-invalid");
  const candidate = link || `https://sandbox.asaas.com/checkoutSession/show?id=${encodeURIComponent(id)}`;
  try {
    const url = new URL(candidate);
    if (url.protocol === "https:" && url.hostname === "sandbox.asaas.com"
      && !url.port && !url.username && !url.password) {
      return { id, url: url.toString() };
    }
  } catch { /* return a generic validation error below */ }
  throw new BillingConfigError("asaas-checkout-url-invalid");
}

export function validWebhookToken(received: string, expected: string) {
  const receivedBytes = Buffer.from(received, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return receivedBytes.length > 0 && receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes);
}
