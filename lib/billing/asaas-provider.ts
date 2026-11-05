export class AsaasProviderError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string) {
    super(code);
    this.name = "AsaasProviderError";
    this.status = status;
    this.code = code;
  }
}

export async function deleteSandboxSubscription(subscriptionId: string, apiKey: string, fetcher: typeof fetch = fetch) {
  if (!/^sub_[A-Za-z0-9]{1,196}$/.test(subscriptionId)) {
    throw new AsaasProviderError(400, "billing-subscription-id-invalid");
  }
  let response: Response;
  try {
    response = await fetcher(`https://api-sandbox.asaas.com/v3/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "DELETE",
      headers: { access_token: apiKey, accept: "application/json", "user-agent": "GrafiCalc/1.0" },
      signal: AbortSignal.timeout(18_000),
      cache: "no-store",
    });
  } catch { throw new AsaasProviderError(502, "billing-provider-unavailable"); }
  if (response.status === 404) return { alreadyRemoved: true };
  if (!response.ok) {
    if (response.status >= 500) throw new AsaasProviderError(502, "billing-provider-unavailable");
    throw new AsaasProviderError(502, "billing-provider-rejected-request");
  }
  return { alreadyRemoved: false };
}
