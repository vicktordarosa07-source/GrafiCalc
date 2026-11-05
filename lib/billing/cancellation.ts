const cancellableStatuses = new Set(["pending", "trialing", "active", "past_due"]);

export function canCancelBillingRecurrence(input: {
  billingCycle?: unknown;
  status?: unknown;
  providerSubscriptionId?: unknown;
  cancelAtPeriodEnd?: unknown;
}) {
  return input.billingCycle === "monthly"
    && typeof input.status === "string" && cancellableStatuses.has(input.status)
    && typeof input.providerSubscriptionId === "string" && /^sub_[A-Za-z0-9]{1,196}$/.test(input.providerSubscriptionId)
    && input.cancelAtPeriodEnd !== true;
}
