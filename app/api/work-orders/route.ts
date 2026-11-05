import { z } from "zod";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, assertWorkspaceBinding, getCollectionAccess, WorkspaceError } from "@/lib/workspace-policy";
import { getBillingAccess } from "@/lib/billing/access";
import { mapWorkOrder, workOrderRpcError } from "@/lib/work-orders";

export const dynamic = "force-dynamic";
const bodySchema = z.object({
  quoteId: z.string().min(1).max(120),
  responsibleUserId: z.string().uuid(),
  promisedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  paidAmount: z.number().finite().min(0),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getWorkspaceContext();
    if (!context) throw new WorkspaceError("unauthorized", 401);
    assertWorkspaceBinding(request, context.user.id, context.tenantId);
    const access = getCollectionAccess(context.payload, context.user.id, context.isLeader, context.profile);
    if (!access.ordersWrite || !access.quotesWrite) throw new WorkspaceError("orders-write-forbidden", 403);
    const billing = await getBillingAccess(context.admin, context.tenantId);
    if (!billing.allowed) throw new WorkspaceError("subscription-required", 402);
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-payload", 400);
    const { data, error } = await context.admin.rpc("graficalc_create_work_order", {
      p_tenant_id: context.tenantId, p_quote_id: parsed.data.quoteId,
      p_responsible_user_id: parsed.data.responsibleUserId,
      p_promised_date: parsed.data.promisedDate || null,
      p_paid_amount: parsed.data.paidAmount, p_actor_user_id: context.user.id,
    });
    if (error) throw workOrderRpcError(error);
    const { data: events } = await context.admin.from("graficalc_work_order_events").select("*")
      .eq("tenant_id", context.tenantId).eq("work_order_id", data.id).order("created_at", { ascending: false });
    return Response.json({ ok: true, workOrder: mapWorkOrder(data, events || []) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
