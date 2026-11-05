const checkoutEvents = new Set(["CHECKOUT_PAID", "CHECKOUT_CANCELED", "CHECKOUT_EXPIRED"]);
const paymentEvents = new Set([
  "PAYMENT_CREATED", "PAYMENT_UPDATED", "PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_OVERDUE", "PAYMENT_AUTHORIZED",
  "PAYMENT_AWAITING_RISK_ANALYSIS", "PAYMENT_APPROVED_BY_RISK_ANALYSIS", "PAYMENT_REPROVED_BY_RISK_ANALYSIS",
  "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED", "PAYMENT_ANTICIPATED",
  "PAYMENT_RESTORED", "PAYMENT_REFUNDED", "PAYMENT_PARTIALLY_REFUNDED", "PAYMENT_CANCELED", "PAYMENT_DELETED",
  "PAYMENT_REFUND_IN_PROGRESS", "PAYMENT_REFUND_DENIED", "PAYMENT_RECEIVED_IN_CASH_UNDONE",
  "PAYMENT_CHARGEBACK_REQUESTED", "PAYMENT_CHARGEBACK_DISPUTE", "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
]);
const subscriptionEvents = new Set(["SUBSCRIPTION_CREATED", "SUBSCRIPTION_UPDATED", "SUBSCRIPTION_INACTIVATED", "SUBSCRIPTION_DELETED"]);

export function isKnownAsaasEvent(eventType) {
  return checkoutEvents.has(eventType) || paymentEvents.has(eventType) || subscriptionEvents.has(eventType);
}

function optionalText(value, max = 500) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = String(value).trim();
  return text ? text.slice(0, max) : null;
}

function safeAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) && Math.abs(value) <= 1_000_000_000 ? value : null;
  if (typeof value !== "string" || !/^-?\d{1,10}(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function safeQuantity(value) {
  const number = typeof value === "number" ? value
    : typeof value === "string" && /^\d{1,7}$/.test(value.trim()) ? Number(value) : Number.NaN;
  return Number.isSafeInteger(number) && number >= 1 && number <= 1_000_000 ? number : null;
}

/** Store only fields used by billing rules; discard names, addresses, card details, and other provider data. */
export function sanitizeAsaasEvent(eventType, payload) {
  const dateCreated = optionalText(payload.dateCreated, 40);
  if (checkoutEvents.has(eventType)) {
    const checkout = payload.checkout || {};
    const items = Array.isArray(checkout.items) ? checkout.items.slice(0, 20).map((value) => {
      const item = value && typeof value === "object" ? value : {};
      return { value: safeAmount(item.value), quantity: safeQuantity(item.quantity) };
    }) : [];
    const subscription = checkout.subscription && typeof checkout.subscription === "object" ? checkout.subscription : {};
    return {
      dateCreated,
      checkout: {
        id: optionalText(checkout.id, 200), items,
        customer: optionalText(checkout.customer, 200),
        subscription: { id: optionalText(subscription.id, 200) },
      },
    };
  }
  if (subscriptionEvents.has(eventType)) {
    const subscription = payload.subscription || {};
    return {
      dateCreated,
      subscription: {
        id: optionalText(subscription.id, 200),
        externalReference: optionalText(subscription.externalReference, 200),
        customer: optionalText(subscription.customer, 200),
        status: optionalText(subscription.status, 40),
      },
    };
  }
  const payment = payload.payment || {};
  return {
    dateCreated,
    payment: {
      id: optionalText(payment.id, 200),
      externalReference: optionalText(payment.externalReference, 200),
      subscription: optionalText(payment.subscription, 200),
      value: safeAmount(payment.value),
      paymentDate: optionalText(payment.paymentDate, 40),
      confirmedDate: optionalText(payment.confirmedDate, 40),
      dateCreated: optionalText(payment.dateCreated, 40),
      dueDate: optionalText(payment.dueDate, 40),
      invoiceUrl: optionalText(payment.invoiceUrl, 1000),
    },
  };
}
