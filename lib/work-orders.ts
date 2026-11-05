import { createClient as createAuthClient } from "@supabase/supabase-js";
import { beginAuthAttempt } from "@/lib/supabase/auth-rate-limit";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { type WorkspaceContext } from "@/lib/workspace";
import { WorkspaceError } from "@/lib/workspace-policy";

export async function verifyWorkOrderPassword(context: WorkspaceContext, password: string, scope: string) {
  const email = context.user.email?.trim();
  if (!email || !password || password.length > 256) throw new WorkspaceError("invalid-credentials", 401);
  const key = `work-order:${context.tenantId}:${context.user.id}:${scope}`;
  if (!await beginAuthAttempt(context.admin, key)) throw new WorkspaceError("too-many-attempts", 429);
  const { url, publishableKey } = getSupabaseServerEnvironment();
  if (!url || !publishableKey) throw new WorkspaceError("auth-unavailable", 503);
  const verifier = createAuthClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await verifier.auth.signInWithPassword({ email, password });
  if (error || data.user?.id !== context.user.id) throw new WorkspaceError("invalid-credentials", 401);
  await context.admin.rpc("graficalc_clear_auth_failures", { p_key: key });
}

export function mapWorkOrder(row: Record<string, any>, events: Record<string, any>[] = []) {
  const quote = row.quote_snapshot || {};
  const total = Number(quote.total || 0);
  const ownerName = row.responsible_name || "";
  return {
    id: row.id,
    osNumber: row.os_number,
    quoteId: row.quote_id,
    quoteTitle: quote.title || "Orçamento",
    clientName: quote.clientName || "",
    clientContact: quote.clientContact || "",
    clientCnpj: quote.clientCnpj || "",
    total,
    paidAmount: Number(row.paid_amount || 0),
    balance: Math.max(0, total - Number(row.paid_amount || 0)),
    status: row.status,
    priority: "normal",
    owner: ownerName,
    responsibleUserId: row.responsible_user_id,
    promisedDate: row.promised_date || "",
    deliveryDate: row.status === "delivered" ? row.updated_at?.slice(0, 10) || "" : "",
    paymentTerms: quote.paymentTerms || "",
    createdAt: row.created_at,
    enteredAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by,
    createdByUsername: row.created_by_name,
    salesUserId: quote.createdByUserId || row.created_by,
    salesUsername: quote.createdByUsername || row.created_by_name,
    sequenceNumber: row.sequence_number,
    items: Array.isArray(quote.items) ? quote.items : [],
    timeline: events.map(event => {
      const after = event.after_values || {};
      const changes = Object.entries(after).map(([key, value]) => {
        const label = ({ paidAmount: "valor pago", promisedDate: "entrega prevista", responsibleName: "responsável", status: "status", notes: "observações" } as Record<string, string>)[key] || key;
        return `${label}: ${key === "paidAmount" ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0)) : String(value ?? "—")}`;
      }).join("; ");
      return {
      id: String(event.id), label: event.event_type === "status_changed" ? "Status alterado" : event.event_type === "created" ? "O.S. gerada" : "Dados atualizados",
      note: `${event.actor_name}: ${event.description}${changes ? ` ${changes}` : ""}`,
      at: event.created_at, actorUserId: event.actor_user_id, actorName: event.actor_name,
      before: event.before_values || {}, after, eventType: event.event_type,
    }; }),
    notes: row.notes || "",
  };
}

export function workOrderRpcError(error: { message?: string; code?: string } | null) {
  const message = error?.message || "work-order-failed";
  if (/quote-not-approved|actor-forbidden|responsible-required|responsible-not-in-team|invalid-status-transition/.test(message)) return new WorkspaceError(message.split("\n")[0], 403);
  if (/quote-changed-requires-approval|already-converted|duplicate|unique/.test(message)) return new WorkspaceError(message.split("\n")[0], 409);
  if (/invalid-paid-amount|invalid-status|invalid-decision|date\/time field value out of range/.test(message)) return new WorkspaceError("invalid-work-order-data", 400);
  if (/quote-not-found|work-order-not-found/.test(message)) return new WorkspaceError(message.split("\n")[0], 404);
  return new WorkspaceError("work-order-storage-unavailable", 503);
}
