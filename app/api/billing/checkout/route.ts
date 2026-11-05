import { buildCheckoutPayload, validatedCheckoutUrl } from "@/lib/billing/catalog";
import { asaasRequest, assertBillingSameOrigin, billingResponseError, BillingRequestError, getConfiguredPlan, requireBillingOwner } from "@/lib/billing/server";
import { deriveBillingAccess } from "@/lib/billing/entitlement";
import { readRequestTextLimited, RequestBodyTooLargeError } from "@/lib/http/request-body";

export const dynamic = "force-dynamic";

function brazilDateAfterDays(days: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const date = new Date(Date.UTC(get("year"), get("month") - 1, get("day") + days, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export async function POST(request: Request) {
  try {
    assertBillingSameOrigin(request);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 8192) throw new BillingRequestError(413, "request-too-large");
    let raw: string;
    try { raw = await readRequestTextLimited(request, 8192); }
    catch (error) {
      if (error instanceof RequestBodyTooLargeError) throw new BillingRequestError(413, "request-too-large");
      throw new BillingRequestError(400, "invalid-request");
    }
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new BillingRequestError(400, "invalid-request"); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new BillingRequestError(400, "invalid-request");
    const { config, plan } = getConfiguredPlan((body as Record<string, unknown>).planKey);
    const { admin, user, tenantId } = await requireBillingOwner();
    const { data: currentSubscription, error: subscriptionError } = await admin.from("graficalc_billing_subscriptions")
      .select("status,trial_started_at,trial_ends_at,current_period_end,grace_days").eq("tenant_id", tenantId).maybeSingle();
    if (subscriptionError) throw new BillingRequestError(503, "billing-storage-unavailable");
    if (currentSubscription?.status !== "legacy_access" && deriveBillingAccess(currentSubscription).allowed) {
      throw new BillingRequestError(409, "subscription-already-active");
    }
    const effectiveTrialDays = currentSubscription?.trial_started_at ? 0 : plan.trialDays;

    const expiresAt = new Date(Date.now() + 60 * 60_000).toISOString();
    const { data: claim, error: claimError } = await admin.rpc("graficalc_claim_billing_checkout", {
      p_tenant_id: tenantId,
      p_user_id: user.id,
      p_plan_key: plan.key,
      p_plan_name: plan.name,
      p_billing_cycle: plan.cycle,
      p_amount_cents: plan.amountCents,
      p_trial_days: effectiveTrialDays,
      p_grace_days: plan.graceDays,
      p_expires_at: expiresAt,
    });
    if (claimError || !claim || typeof claim !== "object") throw new BillingRequestError(503, "billing-storage-unavailable");
    const claimRecord = claim as Record<string, unknown>;
    if (claimRecord.action === "trial-used") throw new BillingRequestError(409, "trial-already-used");
    if (claimRecord.action === "reuse" && typeof claimRecord.checkoutUrl === "string" && typeof claimRecord.providerCheckoutId === "string") {
      const safeCheckout = validatedCheckoutUrl({ id: claimRecord.providerCheckoutId, link: claimRecord.checkoutUrl });
      return Response.json({ ok: true, checkoutUrl: safeCheckout.url, reused: true, amountCents: plan.amountCents }, { headers: { "Cache-Control": "no-store" } });
    }
    if (claimRecord.action !== "create" || typeof claimRecord.checkoutId !== "string" || typeof claimRecord.externalReference !== "string") {
      throw new BillingRequestError(409, "checkout-already-in-progress");
    }

    const effectivePlan = { ...plan, trialDays: effectiveTrialDays };
    const nextDueDate = brazilDateAfterDays(Math.max(1, effectiveTrialDays));
    const payload = buildCheckoutPayload(effectivePlan, claimRecord.externalReference, config.appUrl, nextDueDate);
    let providerResponse: Record<string, unknown>;
    try { providerResponse = await asaasRequest("/checkouts", payload, config.apiKey); }
    catch (error) {
      // A timeout can occur after Asaas has created the Checkout. Keep the database
      // claim locked rather than risk creating a second payment session.
      if (error instanceof BillingRequestError && error.code === "billing-provider-rejected-request") {
        await admin.from("graficalc_billing_checkouts").update({ status: "failed", updated_at: new Date().toISOString() })
          .eq("id", claimRecord.checkoutId).eq("status", "creating");
      }
      throw error;
    }
    const providerCheckout = validatedCheckoutUrl(providerResponse);
    const { data: finalized, error: finalizeError } = await admin.from("graficalc_billing_checkouts").update({
      status: "pending",
      provider_checkout_id: providerCheckout.id,
      checkout_url: providerCheckout.url,
      updated_at: new Date().toISOString(),
    }).eq("id", claimRecord.checkoutId).eq("status", "creating").select("id").maybeSingle();
    if (finalizeError || !finalized) throw new BillingRequestError(503, "checkout-finalization-pending");

    return Response.json({
      ok: true, checkoutUrl: providerCheckout.url, reused: false,
      plan: { key: plan.key, name: plan.name, cycle: plan.cycle, amountCents: plan.amountCents, trialDays: effectiveTrialDays },
      expiresAt,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return billingResponseError(error); }
}
