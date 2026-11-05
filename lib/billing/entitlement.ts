export type BillingAccess = { allowed: boolean; reason: string; until?: string };

export function deriveBillingAccess(data: {
  status: string;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  grace_days?: number | null;
} | null, now = new Date()): BillingAccess {
  if (!data) return { allowed: false, reason: "subscription-required" };
  if (data.status === "legacy_access") return { allowed: true, reason: "legacy-access" };
  if (data.status === "trialing") {
    const trialEnd = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
    if (trialEnd && trialEnd > now) return { allowed: true, reason: "trial-active", until: trialEnd.toISOString() };
    return { allowed: false, reason: "trial-expired" };
  }
  if (data.status === "canceled" && data.trial_ends_at) {
    const trialEnd = new Date(data.trial_ends_at);
    if (trialEnd > now) return { allowed: true, reason: "trial-access-until", until: trialEnd.toISOString() };
  }
  const periodEnd = data.current_period_end ? new Date(data.current_period_end) : null;
  if (["active", "canceled"].includes(data.status) && periodEnd && periodEnd > now) {
    return { allowed: true, reason: data.status === "canceled" ? "access-until-period-end" : "subscription-active", until: periodEnd.toISOString() };
  }
  if (data.status === "past_due" && periodEnd) {
    const graceDays = Math.max(0, Math.min(60, Number(data.grace_days) || 0));
    const graceEnd = new Date(periodEnd.getTime() + graceDays * 86_400_000);
    if (graceEnd > now) return { allowed: true, reason: "payment-grace", until: graceEnd.toISOString() };
  }
  return { allowed: false, reason: data.status === "pending" ? "payment-pending" : "subscription-inactive" };
}
