import { after } from "next/server";
import { billingSecrets, validWebhookToken } from "@/lib/billing/catalog";
import { drainBillingWebhookQueue } from "@/lib/billing/webhook-processor";
import { isKnownAsaasEvent, sanitizeAsaasEvent } from "../../../../lib/billing/webhook-sanitize.mjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { readRequestTextLimited, RequestBodyTooLargeError } from "@/lib/http/request-body";

export const dynamic = "force-dynamic";

type AsaasEvent = {
  id?: unknown;
  event?: unknown;
  checkout?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
};

export async function POST(request: Request) {
  let config: ReturnType<typeof billingSecrets>;
  try { config = billingSecrets(); }
  catch { return Response.json({ error: "billing-disabled" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }

  const token = request.headers.get("asaas-access-token") || "";
  if (!validWebhookToken(token, config.webhookToken)) {
    return Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_048_576) return Response.json({ error: "payload-too-large" }, { status: 413 });
  let raw: string;
  try { raw = await readRequestTextLimited(request, 1_048_576); }
  catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return Response.json({ error: tooLarge ? "payload-too-large" : "invalid-body" }, {
      status: tooLarge ? 413 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let payload: AsaasEvent;
  try { payload = JSON.parse(raw) as AsaasEvent; }
  catch { return Response.json({ error: "invalid-json" }, { status: 400 }); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return Response.json({ error: "invalid-event" }, { status: 400 });
  }
  const eventId = String(payload.id || "");
  const eventType = String(payload.event || "");
  if (!eventId || eventId.length > 200 || !eventType || eventType.length > 100) {
    return Response.json({ error: "invalid-event" }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    const knownEvent = isKnownAsaasEvent(eventType);
    const resourceId = String(payload.checkout?.id || payload.payment?.id || payload.subscription?.id || "").slice(0, 200) || null;
    const { error: insertError } = await admin.from("graficalc_billing_events").upsert({
      provider_event_id: eventId,
      event_type: eventType,
      resource_id: resourceId,
      payload: knownEvent ? sanitizeAsaasEvent(eventType, payload) : null,
      status: knownEvent ? "received" : "ignored",
    }, { onConflict: "provider_event_id", ignoreDuplicates: true });
    if (insertError) throw new Error("billing-event-persist-failed");

    const { data: savedEvent, error: readError } = await admin.from("graficalc_billing_events")
      .select("status").eq("provider_event_id", eventId).maybeSingle();
    if (readError || !savedEvent) throw new Error("billing-event-persist-failed");

    if (knownEvent && savedEvent.status !== "processed" && savedEvent.status !== "ignored") {
      // Post-response execution is backed by the durable database queue and Vercel Cron recovery.
      after(async () => { await drainBillingWebhookQueue(admin, 1); });
    }
    return Response.json({ received: true }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch {
    // Return a failure only when the event was not durably persisted; Asaas will retry it.
    return Response.json({ error: "billing-webhook-persist-failed" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
