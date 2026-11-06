import { getWorkspaceContext, writeWorkspace, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, assertWorkspaceBinding, mergeWorkspace, publicWorkspace, getCollectionAccess, scopeWorkspaceCollections, prepareWorkspaceCollections, WorkspaceError } from "@/lib/workspace-policy";
import { hasValidPinVerification, CONFIG_PIN_COOKIE } from "@/lib/config-pin";
import { cookies } from "next/headers";
import { getBillingAccess } from "@/lib/billing/access";
import { mapWorkOrder } from "@/lib/work-orders";
import { isDeepStrictEqual } from "node:util";

export const dynamic = "force-dynamic";

async function snapshot(context: NonNullable<Awaited<ReturnType<typeof getWorkspaceContext>>>, payload = context.payload, updatedAt = context.updatedAt) {
  const access = getCollectionAccess(payload, context.user.id, context.isLeader, context.profile);
  const source = payload.sharedState || {};
  const quoteHistory = Array.isArray(source.quoteHistory) ? source.quoteHistory : [];
  const [{ data: decisionRows, error: decisionError }, { data: orderRows, error: orderError }] = await Promise.all([
    context.admin.from("graficalc_quote_decisions").select("quote_id,decision,quote_snapshot")
      .eq("tenant_id", context.tenantId),
    access.ordersRead
      ? (context.employeeMode
        ? context.admin.from("graficalc_work_orders").select("*").eq("tenant_id", context.tenantId).eq("responsible_user_id", context.user.id).order("created_at", { ascending: false })
        : context.admin.from("graficalc_work_orders").select("*").eq("tenant_id", context.tenantId).order("created_at", { ascending: false }))
      : Promise.resolve({ data: [], error: null }),
  ]);
  const schemaNotInstalled = [decisionError, orderError].some(error => error?.code === "42P01" || error?.code === "PGRST205");
  if ((decisionError || orderError) && !schemaNotInstalled) throw new WorkspaceError("work-order-storage-unavailable", 503);
  const visibleQuotes = access.quotesReadAll ? quoteHistory : access.quotesWrite
    ? quoteHistory.filter((quote: any) => quote?.createdByUserId === context.user.id) : [];
  const quoteIds = visibleQuotes.map((quote: any) => quote?.id).filter(Boolean);
  const orderIds = (schemaNotInstalled ? [] : (orderRows || []).map(row => row.id));
  const { data: events, error: eventError } = orderIds.length
    ? await context.admin.from("graficalc_work_order_events").select("*").eq("tenant_id", context.tenantId)
      .in("work_order_id", orderIds).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (eventError && eventError.code !== "42P01" && eventError.code !== "PGRST205") throw new WorkspaceError("work-order-storage-unavailable", 503);
  const eventsByOrder = new Map<string, Record<string, any>[]>();
  for (const event of events || []) eventsByOrder.set(event.work_order_id, [...(eventsByOrder.get(event.work_order_id) || []), event]);
  const authoritativeOrders = (schemaNotInstalled ? [] : (orderRows || []).map(row => mapWorkOrder(row, eventsByOrder.get(row.id) || [])));
  if (context.employeeMode) {
    const workOrders = authoritativeOrders.filter(order => order.responsibleUserId === context.user.id);
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthOrders = workOrders.filter(order => String(order.createdAt || "").slice(0, 7) === month);
    return Response.json({
      exists: true,
      payload: { sharedState: { quoteHistory: [], workOrders }, security: { authUsers: [] } },
      updatedAt, userId: context.user.id, tenantId: context.tenantId, isLeader: false, employeeMode: true,
      employeeMetrics: { monthOrderCount: monthOrders.length, monthOrderTotal: monthOrders.reduce((sum, order) => sum + Number(order.total || 0), 0) },
    }, { headers: { "Cache-Control": "private, no-store" } });
  }
  const authoritativeQuoteIds = new Set(authoritativeOrders.map(order => order.quoteId));
  const legacyOrders = (Array.isArray(source.workOrders) ? source.workOrders : [])
    .filter((order: any) => !authoritativeQuoteIds.has(order?.quoteId))
    .map((order: any) => ({
      ...order, legacy: true,
      paidAmount: Number(order.paidAmount ?? order.entryAmount ?? 0),
      balance: Math.max(0, Number(order.total || 0) - Number(order.paidAmount ?? order.entryAmount ?? 0)),
    }));
  const orderList = [...authoritativeOrders, ...legacyOrders];
  const orderByQuote = new Map(orderList.map(order => [order.quoteId, order]));
  const decisionByQuote = new Map((decisionRows || []).map(row => [row.quote_id, row]));
  const enrichedQuotes = quoteHistory.map((quote: any) => {
    if (!quoteIds.includes(quote?.id)) return quote;
    const order = orderByQuote.get(quote.id);
    const decisionRow = decisionByQuote.get(quote.id);
    const snapshotMatches = decisionRow ? isDeepStrictEqual(decisionRow.quote_snapshot, quote) : false;
    return {
      ...quote,
      serverDecision: snapshotMatches ? decisionRow?.decision || "" : "",
      serverDecisionStale: Boolean(decisionRow && !snapshotMatches),
      serverOsId: order?.id || "",
      serverOsNumber: order?.osNumber || "",
    };
  });
  const enhancedPayload = {
    ...payload,
    sharedState: {
      ...source,
      quoteHistory: enrichedQuotes,
      workOrders: access.ordersRead ? orderList : [],
    },
  };
  const visible = scopeWorkspaceCollections(publicWorkspace(enhancedPayload, context.memberIds), access, context.user.id);
  visible.security.authUsers = context.members;
  return Response.json({ exists: true, payload: visible, updatedAt, userId: context.user.id, tenantId: context.tenantId, permissions: context.permissions, isLeader: context.isLeader }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function GET(request: Request) {
  try {
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    const billing = await getBillingAccess(context.admin, context.tenantId);
    if (!billing.allowed) return Response.json({ ok: false, error: "subscription-required", billingUrl: "/assinatura", reason: billing.reason }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
    return snapshot(context);
  } catch (error) { return workspaceError(error); }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    if (context.employeeMode) throw new WorkspaceError("employee-mode-read-only", 403);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    const billing = await getBillingAccess(context.admin, context.tenantId);
    if (!billing.allowed) return Response.json({ ok: false, error: "subscription-required", billingUrl: "/assinatura", reason: billing.reason }, { status: 402, headers: { "Cache-Control": "private, no-store" } });
    if (Number(request.headers.get("content-length")) > 15_000_000) throw new WorkspaceError("payload-too-large", 413);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 15_000_000) throw new WorkspaceError("payload-too-large", 413);
    let body;
    try { body = JSON.parse(raw); } catch { throw new WorkspaceError("invalid-payload", 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new WorkspaceError("invalid-payload", 400);
    if (!Object.hasOwn(body, "baseUpdatedAt") || body.baseUpdatedAt !== context.updatedAt) throw new WorkspaceError("workspace-conflict", 409);
    const publishConfig = body.publishConfig === true;
    const access = getCollectionAccess(context.payload, context.user.id, context.isLeader, context.profile);
    const authorized = prepareWorkspaceCollections(context.payload, body, access, context.user.id);
    const payload = mergeWorkspace(context.payload, authorized, {
      isLeader: context.isLeader, canEdit: context.permissions.edit, memberIds: context.memberIds, publishConfig,
      pinVerified: publishConfig && await hasValidPinVerification(context.user.id, context.tenantId, context.payload.config?.security?.configAccess, context.updatedAt),
    });
    const updatedAt = await writeWorkspace(context, payload);
    if (publishConfig) (await cookies()).delete(CONFIG_PIN_COOKIE);
    return snapshot(context, payload, updatedAt);
  } catch (error) { return workspaceError(error); }
}
