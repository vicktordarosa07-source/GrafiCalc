import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { workspaceError } from "@/lib/workspace";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { beginAuthAttempt } from "@/lib/supabase/auth-rate-limit";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { createClient as createAuthClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE, readEmployeeLock, readEmployeeModeSession } from "@/lib/employee-mode";

export const dynamic = "force-dynamic";
const schema = z.object({ password: z.string().min(1).max(256) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-owner-password", 400);
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new WorkspaceError("unauthorized", 401);
    const cookieJar = await cookies();
    const lock = readEmployeeLock(cookieJar.get(EMPLOYEE_LOCK_COOKIE)?.value);
    const employee = readEmployeeModeSession(cookieJar.get(EMPLOYEE_MODE_COOKIE)?.value);
    const tenantId = lock?.tenantId || employee?.tenantId;
    if (!tenantId || (lock && lock.ownerId !== user.id) || (employee && employee.ownerId !== user.id)) {
      throw new WorkspaceError("employee-session-required", 403);
    }
    const admin = createAdminClient();
    const { data: tenant, error: tenantError } = await admin.from("graficalc_tenants")
      .select("id,owner_id").eq("id", tenantId).maybeSingle();
    if (tenantError) throw new WorkspaceError("employee-session-unavailable", 503);
    if (!tenant || tenant.owner_id !== user.id) throw new WorkspaceError("team-leader-required", 403);

    const key = `employee-mode-exit:${tenantId}:${user.id}`;
    if (!await beginAuthAttempt(admin, key)) throw new WorkspaceError("too-many-attempts", 429);
    const { url, publishableKey } = getSupabaseServerEnvironment();
    if (!url || !publishableKey) throw new WorkspaceError("auth-unavailable", 503);
    const verifier = createAuthClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data, error } = await verifier.auth.signInWithPassword({ email: user.email, password: parsed.data.password });
    if (error || data.user?.id !== user.id) throw new WorkspaceError("invalid-owner-password", 401);
    await admin.rpc("graficalc_clear_auth_failures", { p_key: key });
    cookieJar.delete(EMPLOYEE_MODE_COOKIE);
    cookieJar.delete(EMPLOYEE_LOCK_COOKIE);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
