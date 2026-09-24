import { getPinContext } from "@/lib/config-pin";

export const dynamic = "force-dynamic";

export async function GET() {
  const context = await getPinContext();
  if (!context) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const access = context.payload.config?.security?.configAccess || {};
  return Response.json({
    ok: true,
    permissions: context.permissions,
    pinConfigured: Boolean(access.pinHash || access.password),
  }, { headers: { "Cache-Control": "no-store" } });
}
