"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { deriveBillingAccess } from "@/lib/billing/entitlement";
import { summarizeBillingDates } from "@/lib/billing/presentation";

type Plan = { key: string; name: string; description: string; amountCents: number; cycle: "monthly" | "annual"; trialDays: number; trialConfiguredDays: number; trialUsed: boolean; graceDays: number };
type Payment = { provider_payment_id: string; amount_cents: number; status: string; due_at: string | null; paid_at: string | null; invoice_url: string | null; created_at: string };
type Subscription = { plan_name: string | null; billing_cycle: string | null; amount_cents: number | null; status: string; trial_ends_at: string | null; current_period_end: string | null; grace_days: number; cancel_at_period_end: boolean; canCancelRecurrence: boolean };

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });
const statuses: Record<string, string> = {
  legacy_access: "Acesso atual preservado",
  pending: "Aguardando pagamento",
  trialing: "Período de teste ativo",
  active: "Assinatura ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  expired: "Expirada",
  refunded: "Pagamento estornado",
  review: "Em análise",
  paid: "Pago",
  overdue: "Vencido",
  confirmed: "Confirmado",
  canceled_payment: "Cancelado",
};

async function readJson(response: Response) {
  const value = await response.json().catch(() => ({}));
  if (!response.ok || value?.ok === false) throw new Error(value?.error || "billing-unavailable");
  return value;
}

function displayDate(value: string | null | undefined) {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : date.format(parsed);
}

export function SubscriptionPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [openCheckout, setOpenCheckout] = useState<{ checkout_url: string; expires_at: string } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingPlan, setSubmittingPlan] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [message, setMessage] = useState("");
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const cancelTitleRef = useRef<HTMLHeadingElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const returnFocusToCancelButton = useRef(false);
  const skipCancelButtonReturn = useRef(false);
  const focusCancelResult = useRef(false);

  useEffect(() => {
    if (confirmCancel) {
      returnFocusToCancelButton.current = true;
      cancelTitleRef.current?.focus();
      return;
    }
    if (!returnFocusToCancelButton.current) return;
    returnFocusToCancelButton.current = false;
    if (!skipCancelButtonReturn.current) cancelButtonRef.current?.focus();
    skipCancelButtonReturn.current = false;
  }, [confirmCancel]);

  useEffect(() => {
    if (!focusCancelResult.current || !message) return;
    focusCancelResult.current = false;
    messageRef.current?.focus();
  }, [message]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountResult, plansResult] = await Promise.allSettled([
        fetch("/api/billing/account", { cache: "no-store" }).then(readJson),
        fetch("/api/billing/plans", { cache: "no-store" }).then(readJson),
      ]);

      if (accountResult.status === "fulfilled") {
        setSubscription(accountResult.value.subscription);
        setPayments(accountResult.value.payments || []);
        setOpenCheckout(accountResult.value.openCheckout);
      }
      if (plansResult.status === "fulfilled") setPlans(plansResult.value.plans || []);
      else setPlans([]);

      const failure = accountResult.status === "rejected"
        ? accountResult.reason
        : plansResult.status === "rejected" ? plansResult.reason : null;
      if (!failure) return;

      const code = failure instanceof Error ? failure.message : "billing-unavailable";
      if (code === "billing-owner-required") setError("Somente o titular da gráfica pode consultar ou contratar a assinatura.");
      else if (code === "subscription-already-active") setError("Sua assinatura ou período de teste ainda está ativo. Não é necessário abrir outra cobrança.");
      else if (["billing-disabled", "billing-credentials-incomplete", "billing-plans-not-configured", "billing-storage-unavailable", "billing-configuration-unavailable"].includes(code)) {
        setError(accountResult.status === "fulfilled"
          ? "Os dados da assinatura foram carregados, mas os planos ainda não estão configurados para contratação."
          : "A área de assinatura ainda não foi configurada para homologação.");
      } else setError(accountResult.status === "fulfilled"
        ? "Os dados da assinatura foram carregados, mas não foi possível obter os planos agora. Tente novamente."
        : "Não foi possível carregar a assinatura agora. Tente novamente.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billingState = params.get("billing");
    if (billingState === "return") setMessage("Retorno do checkout recebido. A liberação depende da confirmação do Asaas; esta página não considera o redirecionamento como pagamento.");
    else if (billingState === "cancel") setMessage("O checkout foi cancelado. Nenhuma assinatura foi ativada por esse retorno.");
    else if (billingState === "expired") setMessage("O checkout expirou. Você pode iniciar uma nova tentativa.");
    else if (params.get("acesso") === "restrito") setMessage("O acesso ao workspace está suspenso até uma assinatura válida ser confirmada. Seus dados permanecem armazenados.");
    else if (params.get("erro") === "indisponivel") setMessage("Não foi possível verificar o estado da assinatura. Acesse novamente depois ou fale com o suporte.");
    void refresh();
  }, [refresh]);

  const currentStatus = useMemo(() => subscription ? statuses[subscription.status] || "Status em processamento" : "Nenhum plano contratado", [subscription]);
  const existingAccess = Boolean(subscription && subscription.status !== "legacy_access" && deriveBillingAccess(subscription).allowed);
  const billingDates = useMemo(() => summarizeBillingDates(subscription, payments), [subscription, payments]);

  async function beginCheckout(planKey: string) {
    setSubmittingPlan(planKey);
    setError("");
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey }),
      });
      const value = await readJson(response);
      const checkout = new URL(value.checkoutUrl);
      if (checkout.protocol !== "https:" || checkout.hostname !== "sandbox.asaas.com" && !checkout.hostname.endsWith(".sandbox.asaas.com")) {
        throw new Error("billing-url-invalid");
      }
      window.location.assign(checkout.toString());
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "";
      if (code === "subscription-already-active") setError("Sua assinatura ou período de teste ainda está ativo. Não é necessário abrir outra cobrança.");
      else if (code === "trial-already-used") setError("O período de teste desta gráfica já foi usado. Atualize a página para ver as condições atuais do plano antes de continuar.");
      else if (code === "checkout-already-in-progress") setError("Já existe uma tentativa de checkout em andamento. Reabra o pagamento pendente ou aguarde a expiração.");
      else setError("Não foi possível iniciar o checkout. Seus dados não foram alterados; tente novamente.");
      setSubmittingPlan("");
    }
  }

  async function cancelRecurrence() {
    setCanceling(true);
    setError("");
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const value = await readJson(response);
      skipCancelButtonReturn.current = true;
      focusCancelResult.current = true;
      setConfirmCancel(false);
      setMessage(value.alreadyCanceled
        ? "A renovação já estava cancelada. O acesso continua até o fim do período vigente ou do teste ativo."
        : "Renovação cancelada no Asaas. O acesso continua até o fim do período vigente ou do teste ativo.");
      await refresh();
    } catch {
      setError("Não foi possível cancelar a renovação agora. Confira o status da assinatura e tente novamente.");
    } finally { setCanceling(false); }
  }

  return (
    <div className="subscription-panel" aria-busy={loading || Boolean(submittingPlan) || canceling}>
      {message && <div ref={messageRef} className="billing-notice" role="status" tabIndex={-1}>{message}</div>}
      {error && <div className="form-error billing-error" role="alert">{error}</div>}
      {loading ? <p className="billing-muted" role="status">Carregando dados da assinatura…</p> : <>
        <section className="billing-card" aria-labelledby="billing-current-title">
          <div className="billing-card-heading"><div><p className="eyebrow">Minha assinatura</p><h2 id="billing-current-title">{subscription?.plan_name || "Seu acesso"}</h2></div><span className={`billing-status billing-status-${subscription?.status || "none"}`}>{currentStatus}</span></div>
          <dl className="billing-details">
            <div><dt>Valor</dt><dd>{subscription?.amount_cents ? money.format(subscription.amount_cents / 100) : "—"}</dd></div>
            <div><dt>Periodicidade</dt><dd>{subscription?.billing_cycle === "monthly" ? "Mensal" : subscription?.billing_cycle === "annual" ? "Anual" : "—"}</dd></div>
            <div><dt>Teste até</dt><dd>{displayDate(subscription?.trial_ends_at)}</dd></div>
            <div><dt>Último pagamento</dt><dd>{displayDate(billingDates.lastPaymentAt)}</dd></div>
            <div><dt>{billingDates.periodLabel}</dt><dd>{displayDate(billingDates.periodEndAt)}</dd></div>
          </dl>
          {openCheckout?.checkout_url && <a className="button button-primary" href={openCheckout.checkout_url}>Continuar pagamento pendente</a>}
          {subscription?.cancel_at_period_end && <p className="billing-notice" role="status">A renovação está cancelada. O acesso permanece até {displayDate(subscription.trial_ends_at || subscription.current_period_end)}.</p>}
          {subscription?.canCancelRecurrence && <div className="billing-cancel">
            {!confirmCancel ? <button ref={cancelButtonRef} className="button button-secondary" type="button" disabled={canceling} onClick={() => setConfirmCancel(true)}>Cancelar renovação</button> : <div className="billing-cancel-confirm" role="group" aria-labelledby="billing-cancel-title">
              <h3 ref={cancelTitleRef} id="billing-cancel-title" className="billing-cancel-title" tabIndex={-1}>Confirmar cancelamento da renovação?</h3>
              <p>O Asaas interromperá as próximas cobranças recorrentes e poderá remover cobranças pendentes ou vencidas ligadas à assinatura. Um período já pago ou de teste continua até a data registrada.</p>
              <div className="billing-cancel-actions">
                <button className="button button-secondary" type="button" disabled={canceling} onClick={() => setConfirmCancel(false)}>Manter assinatura</button>
                <button className="button billing-cancel-danger" type="button" disabled={canceling} aria-busy={canceling} onClick={() => void cancelRecurrence()}>{canceling ? "Cancelando…" : "Confirmar cancelamento"}</button>
              </div>
            </div>}
          </div>}
        </section>

        <section className="billing-card" aria-labelledby="billing-plans-title">
          <div className="billing-card-heading"><div><p className="eyebrow">Planos</p><h2 id="billing-plans-title">Escolha sua assinatura</h2></div></div>
          {plans.length ? <div className="billing-plans">{plans.map((plan) => (
            <article className="billing-plan" key={plan.key}>
              <div><h3>{plan.name}</h3><p>{plan.description}</p></div>
              <p className="billing-plan-price">{money.format(plan.amountCents / 100)}<span>{plan.cycle === "monthly" ? " / mês · renovação automática no cartão" : " / ano · pagamento avulso, sem renovação automática"}</span></p>
              {plan.trialDays > 0 && <p className="billing-muted">Teste: {plan.trialDays} dias</p>}
              {plan.trialUsed && plan.trialConfiguredDays > 0 && <p className="billing-muted">O teste grátis já foi usado; a contratação começa sem um novo período de teste.</p>}
              {plan.graceDays > 0 && <p className="billing-muted">Carência após vencimento: {plan.graceDays} dias</p>}
              <button type="button" className="button button-primary" aria-label={submittingPlan === plan.key ? `Preparando checkout do plano ${plan.name}` : `Contratar plano ${plan.name}`} aria-busy={submittingPlan === plan.key} disabled={Boolean(submittingPlan) || existingAccess} onClick={() => void beginCheckout(plan.key)}>
                {submittingPlan === plan.key ? "Preparando checkout…" : existingAccess ? "Acesso vigente" : "Contratar plano"}
              </button>
            </article>
          ))}</div> : <p className="billing-muted">Os planos aparecerão aqui quando forem configurados para o GrafiCalc.</p>}
          {existingAccess && <p className="billing-muted" role="status">Seu acesso atual continua vigente. Uma nova contratação ficará disponível quando esse período terminar ou a assinatura for regularizada.</p>}
        </section>

        <section className="billing-card" aria-labelledby="billing-history-title">
          <div className="billing-card-heading"><div><p className="eyebrow">Histórico</p><h2 id="billing-history-title">Pagamentos</h2></div><button className="button button-secondary" type="button" disabled={loading} aria-busy={loading} onClick={() => void refresh()}>{loading ? "Atualizando…" : "Atualizar status"}</button></div>
          {payments.length ? <div className="billing-payment-list">{payments.map((payment) => (
            <article className="billing-payment" key={payment.provider_payment_id}>
              <div><strong>{money.format(payment.amount_cents / 100)}</strong><span>{statuses[payment.status] || "Em processamento"}</span></div>
              <div><span>Vencimento: {displayDate(payment.due_at)}</span><span>Pago: {displayDate(payment.paid_at)}</span></div>
              {payment.invoice_url && <a href={payment.invoice_url} target="_blank" rel="noreferrer">Abrir cobrança</a>}
            </article>
          ))}</div> : <p className="billing-muted">Nenhum pagamento registrado.</p>}
        </section>
      </>}
    </div>
  );
}
