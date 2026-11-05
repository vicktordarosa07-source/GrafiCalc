type SubscriptionDateSummaryInput = {
  billing_cycle: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end?: boolean;
} | null;

type PaymentDateSummaryInput = { status: string; paid_at: string | null };

export function summarizeBillingDates(
  subscription: SubscriptionDateSummaryInput,
  payments: PaymentDateSummaryInput[],
) {
  const lastPaymentAt = payments.reduce<string | null>((latest, payment) => {
    if (payment.status !== "paid" || !payment.paid_at) return latest;
    const paidAtTime = Date.parse(payment.paid_at);
    const latestTime = latest ? Date.parse(latest) : Number.NEGATIVE_INFINITY;
    if (Number.isFinite(paidAtTime) && paidAtTime > latestTime) return payment.paid_at;
    return latest;
  }, null);

  const periodLabel = subscription?.status === "past_due"
    ? "Vencimento pendente"
    : subscription?.billing_cycle === "monthly"
      && ["active", "trialing"].includes(subscription.status)
      && !subscription.cancel_at_period_end
      ? "Próximo vencimento"
      : "Acesso até";

  return { lastPaymentAt, periodLabel, periodEndAt: subscription?.current_period_end || null };
}
