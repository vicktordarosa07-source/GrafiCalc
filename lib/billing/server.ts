import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDeveloperEligible } from "@/lib/developer-session";
import { BillingConfigError, billingConfig, billingSecrets, type BillingPlan } from "@/lib/billing/catalog";
import { isBillingSameOrigin } from "@/lib/billing/origin";
import { AsaasProviderError, deleteSandboxSubscription } from "@/lib/billing/asaas-provider";
import { readResponseTextLimited } from "@/lib/http/response-body.mjs";

export class BillingRequestError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
    this.name = "BillingRequestError";
  }
}

export function assertBillingSameOrigin(request: Request) {
  const valid = isBillingSameOrigin(
    request.headers.get("origin"),
    request.headers.get("host"),
    request.headers.get("x-forwarded-proto"),
    request.url,
  );
  if (!valid) throw new BillingRequestError(403, "invalid-origin");
}

export async function requireBillingOwner() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email_confirmed_at) throw new BillingRequestError(401, "unauthorized");
  if (isDeveloperEligible(user)) throw new BillingRequestError(403, "developer-account-not-billable");

  let admin;
  try { admin = createAdminClient(); }
  catch { throw new BillingRequestError(503, "billing-storage-unavailable"); }
  const { data: profile, error: profileError } = await admin
    .from("profiles").select("tenant_id").eq("id", user.id).maybeSingle();
  if (profileError) throw new BillingRequestError(503, "billing-storage-unavailable");
  if (!profile?.tenant_id) throw new BillingRequestError(403, "workspace-not-provisioned");
  const { data: tenant, error: tenantError } = await admin
    .from("graficalc_tenants").select("id,owner_id").eq("id", profile.tenant_id).maybeSingle();
  if (tenantError) throw new BillingRequestError(503, "billing-storage-unavailable");
  if (!tenant || tenant.owner_id !== user.id) throw new BillingRequestError(403, "billing-owner-required");
  return { admin, user, tenantId: String(tenant.id) };
}

export async function asaasRequest(path: string, body: unknown, apiKey?: string, fetcher: typeof fetch = fetch) {
  let key = apiKey;
  if (!key) {
    try { key = billingSecrets().apiKey; }
    catch (error) {
      if (error instanceof BillingConfigError) throw new BillingRequestError(503, error.message);
      throw error;
    }
  }
  let response: Response;
  try {
    response = await fetcher(`https://api-sandbox.asaas.com/v3${path}`, {
      method: "POST",
      headers: { access_token: key, accept: "application/json", "content-type": "application/json", "user-agent": "GrafiCalc/1.0" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(18_000),
      cache: "no-store",
    });
  } catch { throw new BillingRequestError(502, "billing-provider-unavailable"); }
  let raw: string;
  try { raw = await readResponseTextLimited(response, 65_536); }
  catch { throw new BillingRequestError(502, "billing-provider-invalid-response"); }
  let data: unknown = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { throw new BillingRequestError(502, "billing-provider-invalid-response"); }
  if (!response.ok) {
    // Never forward provider details: they can include identifiers or submitted customer data.
    // A provider 5xx can occur after the Checkout was created; keep the reservation locked on that ambiguous result.
    if (response.status >= 500) throw new BillingRequestError(502, "billing-provider-unavailable");
    throw new BillingRequestError(502, "billing-provider-rejected-request");
  }
  return data as Record<string, unknown>;
}

export async function asaasDeleteSubscription(subscriptionId: string, apiKey?: string, fetcher: typeof fetch = fetch) {
  let key = apiKey;
  if (!key) {
    try { key = billingSecrets().apiKey; }
    catch (error) {
      if (error instanceof BillingConfigError) throw new BillingRequestError(503, error.message);
      throw error;
    }
  }
  try { return await deleteSandboxSubscription(subscriptionId, key, fetcher); }
  catch (error) {
    if (error instanceof AsaasProviderError) throw new BillingRequestError(error.status, error.code);
    throw error;
  }
}

export function getConfiguredPlan(key: unknown): { config: ReturnType<typeof billingConfig>; plan: BillingPlan } {
  let config: ReturnType<typeof billingConfig>;
  try { config = billingConfig(); }
  catch (error) {
    if (error instanceof BillingConfigError) throw new BillingRequestError(503, error.message);
    throw error;
  }
  const plan = config.plans.find((candidate) => candidate.key === String(key || ""));
  if (!plan) throw new BillingRequestError(400, "billing-plan-invalid");
  return { config, plan };
}

export function billingResponseError(error: unknown) {
  if (error instanceof BillingRequestError) {
    return Response.json({ ok: false, error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: false, error: "billing-unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
