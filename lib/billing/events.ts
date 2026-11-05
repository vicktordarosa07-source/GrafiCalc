export type BillingPaymentState = "pending" | "paid" | "overdue" | "refunded" | "review" | "canceled";

export function resolveBillingTenantId(checkoutTenantId: unknown, subscriptionTenantId: unknown): string | null {
  const checkoutTenant = typeof checkoutTenantId === "string" ? checkoutTenantId.trim() : "";
  const subscriptionTenant = typeof subscriptionTenantId === "string" ? subscriptionTenantId.trim() : "";
  if (checkoutTenant && subscriptionTenant && checkoutTenant !== subscriptionTenant) {
    throw new Error("billing-tenant-mismatch");
  }
  return checkoutTenant || subscriptionTenant || null;
}

export function shouldApplyPaymentToSubscription(input: {
  nextState: BillingPaymentState;
  paymentId: string;
  lastPaymentId: unknown;
  priorPaidAt: unknown;
  paymentAt?: unknown;
  lastPaymentAt?: unknown;
}): boolean {
  const lastPaymentId = typeof input.lastPaymentId === "string" ? input.lastPaymentId : "";
  const wasPreviouslyPaid = typeof input.priorPaidAt === "string" && Number.isFinite(Date.parse(input.priorPaidAt));
  const paymentAt = typeof input.paymentAt === "string" ? Date.parse(input.paymentAt) : Number.NaN;
  const lastPaymentAt = typeof input.lastPaymentAt === "string" ? Date.parse(input.lastPaymentAt) : Number.NaN;
  const isOlderUnseenPayment = Number.isFinite(paymentAt) && Number.isFinite(lastPaymentAt) && paymentAt < lastPaymentAt;
  const isHistoricalPayment = Boolean(lastPaymentId) && lastPaymentId !== input.paymentId && (wasPreviouslyPaid || isOlderUnseenPayment);
  return !(isHistoricalPayment && ["paid", "refunded"].includes(input.nextState));
}

export function paymentStateForEvent(eventType: string): BillingPaymentState {
  if (["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(eventType)) return "paid";
  if (eventType === "PAYMENT_REFUND_DENIED") return "paid";
  if (eventType === "PAYMENT_RESTORED") return "pending";
  if (eventType === "PAYMENT_OVERDUE") return "overdue";
  if (eventType === "PAYMENT_REFUNDED") return "refunded";
  if (["PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL", "PAYMENT_RECEIVED_IN_CASH_UNDONE"].includes(eventType)) return "review";
  if (["PAYMENT_CANCELED", "PAYMENT_DELETED", "PAYMENT_REPROVED_BY_RISK_ANALYSIS", "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"].includes(eventType)) return "canceled";
  return "pending";
}

export function resolvePaymentState(eventType: string, priorState: string, amountMismatch: boolean): BillingPaymentState {
  const eventState = paymentStateForEvent(eventType);
  if (amountMismatch) return "review";
  if (eventType === "PAYMENT_REFUND_DENIED") return "paid";
  const recoveryEvent = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"].includes(eventType);
  if (priorState === "refunded") return "refunded";
  if (priorState === "review" && !recoveryEvent) return "review";
  if (["paid", "confirmed"].includes(priorState) && ["pending", "overdue", "canceled"].includes(eventState)) {
    return "paid";
  }
  if (priorState === "overdue" && eventState === "pending") return "overdue";
  return eventState;
}
