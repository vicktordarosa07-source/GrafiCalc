type AuthRateLimitError = { code?: string; message?: string };
type AuthRateLimitRpcClient = {
  rpc(name: string, args: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: AuthRateLimitError | null;
  }>;
};

function isMissingAtomicFunction(error: AuthRateLimitError) {
  return error.code === "PGRST202"
    || error.code === "42883"
    || /could not find the function .*graficalc_begin_auth_attempt|function .*graficalc_begin_auth_attempt.*does not exist/i.test(error.message || "");
}

/**
 * Prefer the atomic attempt reservation. Until migration 08 reaches production,
 * use the pre-existing check/record RPC pair instead of disabling login/PIN.
 */
export async function beginAuthAttempt(client: AuthRateLimitRpcClient, key: string) {
  const atomic = await client.rpc("graficalc_begin_auth_attempt", { p_key: key });
  if (!atomic.error) return Boolean(atomic.data);
  if (!isMissingAtomicFunction(atomic.error)) throw new Error("Authentication rate limit is unavailable.");

  const legacy = await client.rpc("graficalc_auth_attempt_allowed", { p_key: key });
  if (legacy.error) throw new Error("Authentication rate limit is unavailable.");
  if (!legacy.data) return false;

  const recorded = await client.rpc("graficalc_record_auth_failure", { p_key: key });
  if (recorded.error) throw new Error("Authentication rate limit is unavailable.");
  return true;
}
