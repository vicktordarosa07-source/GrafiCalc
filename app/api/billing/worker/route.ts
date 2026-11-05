import { isStrongSecret, validWebhookToken } from "@/lib/billing/catalog";
import { drainBillingWebhookQueue } from "@/lib/billing/webhook-processor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!isStrongSecret(secret)) {
    return Response.json({ ok: false, error: "worker-not-configured" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const authorization = request.headers.get("authorization") || "";
  const received = authorization.match(/^Bearer\s+(.+)$/i)?.[1] || "";
  if (!validWebhookToken(received, secret)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const result = await drainBillingWebhookQueue(createAdminClient(), 25);
    return Response.json({ ok: result.failed === 0, ...result }, {
      status: result.failed === 0 ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ ok: false, error: "billing-worker-failed" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
