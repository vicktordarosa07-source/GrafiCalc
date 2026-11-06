import { z } from "zod";
import { getWorkspaceContext, workspaceError } from "@/lib/workspace";
import { assertSameOrigin, assertWorkspaceBinding, getCollectionAccess, WorkspaceError } from "@/lib/workspace-policy";
import { getBillingAccess } from "@/lib/billing/access";
import { mapWorkOrder, verifyWorkOrderPassword, workOrderRpcError } from "@/lib/work-orders";

export const dynamic = "force-dynamic";
const updateSchema = z.object({
  password: z.string().min(1).max(256).optional(),
  paidAmount: z.number().finite().min(0).optional(),
  promisedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")).optional(),
  notes: z.string().max(2000).optional(),
  responsibleUserId: z.string().uuid().optional(),
}).strict().refine(value => [value.paidAmount, value.promisedDate, value.notes, value.responsibleUserId].some(item => typeof item !== "undefined"));
const statusSchema = z.object({ password: z.string().min(1).max(256).optional(), status: z.enum(["production", "ready", "delivered"]) }).strict();

async function authorize(request: Request, id: string) {
  assertSameOrigin(request);
  const context = await getWorkspaceContext();
  if (!context) throw new WorkspaceError("unauthorized", 401);
  assertWorkspaceBinding(request, context.user.id, context.tenantId);
  const access = getCollectionAccess(context.payload, context.user.id, context.isLeader, context.profile);
  if (!access.ordersWrite) throw new WorkspaceError("orders-write-forbidden", 403);
  const billing = await getBillingAccess(context.admin, context.tenantId);
  if (!billing.allowed) throw new WorkspaceError("subscription-required", 402);
  const { data: order, error } = await context.admin.from("graficalc_work_orders").select("id,responsible_user_id")
    .eq("id", id).eq("tenant_id", context.tenantId).maybeSingle();
  if (error) throw new WorkspaceError("work-order-storage-unavailable", 503);
  if (!order) throw new WorkspaceError("work-order-not-found", 404);
  if (order.responsible_user_id !== context.user.id) throw new WorkspaceError("responsible-required", 403);
  return context;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await authorize(request, id);
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-payload", 400);
    if (context.employeeMode) {
      if (parsed.data.responsibleUserId && parsed.data.responsibleUserId !== context.user.id) throw new WorkspaceError("responsible-required", 403);
    } else if (!parsed.data.password) throw new WorkspaceError("invalid-credentials", 401);
    else await verifyWorkOrderPassword(context, parsed.data.password, id);
    const { password, ...patch } = parsed.data;
    const { data, error } = await context.admin.rpc("graficalc_update_work_order", {
      p_tenant_id: context.tenantId, p_work_order_id: id, p_actor_user_id: context.user.id,
      p_patch: { ...patch, paidAmount: patch.paidAmount },
    });
    if (error) throw workOrderRpcError(error);
    const { data: events } = await context.admin.from("graficalc_work_order_events").select("*")
      .eq("tenant_id", context.tenantId).eq("work_order_id", id).order("created_at", { ascending: false });
    return Response.json({ ok: true, workOrder: mapWorkOrder(data, events || []) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const context = await authorize(request, id);
    const parsed = statusSchema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-payload", 400);
    if (!context.employeeMode) {
      if (!parsed.data.password) throw new WorkspaceError("invalid-credentials", 401);
      await verifyWorkOrderPassword(context, parsed.data.password, id);
    }
    const { data, error } = await context.admin.rpc("graficalc_change_work_order_status", {
      p_tenant_id: context.tenantId, p_work_order_id: id,
      p_actor_user_id: context.user.id, p_status: parsed.data.status,
    });
    if (error) throw workOrderRpcError(error);
    const { data: events } = await context.admin.from("graficalc_work_order_events").select("*")
      .eq("tenant_id", context.tenantId).eq("work_order_id", id).order("created_at", { ascending: false });
    return Response.json({ ok: true, workOrder: mapWorkOrder(data, events || []) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
