import { z } from "zod";
import { createClient as createAuthClient } from "@supabase/supabase-js";
import { assertSameOrigin, WorkspaceError } from "@/lib/workspace-policy";
import { getTeamEntryContext } from "@/lib/team-entry";
import { workspaceError } from "@/lib/workspace";
import { beginAuthAttempt } from "@/lib/supabase/auth-rate-limit";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { hashPin, matchesCurrentPin, validPin } from "@/lib/config-pin";
import {
  ADMIN_MODE_COOKIE, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE,
  adminModeCookieOptions, createAdminModeSession, createEmployeeLock,
  createEmployeeModeSession, employeeLockCookieOptions, employeeModeCookieOptions,
} from "@/lib/employee-mode";
import { verifyEmployeePin } from "@/lib/employee-pin";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("admin"), pin: z.string().regex(/^\d{4,6}$/) }).strict(),
  z.object({ mode: z.literal("employee"), employeeId: z.string().uuid(), pin: z.string().regex(/^\d{4}$/) }).strict(),
  z.object({ mode: z.literal("setup-admin"), password: z.string().min(1).max(256), pin: z.string().regex(/^\d{4,6}$/), confirmPin: z.string().regex(/^\d{4,6}$/) }).strict().refine(value => value.pin === value.confirmPin),
]);

async function verifyOwnerPassword(email: string, password: string) {
  const { url, publishableKey } = getSupabaseServerEnvironment();
  if (!url || !publishableKey) throw new WorkspaceError("auth-unavailable", 503);
  const verifier = createAuthClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await verifier.auth.signInWithPassword({ email, password });
  if (error || data.user?.email?.toLowerCase() !== email.toLowerCase()) throw new WorkspaceError("invalid-owner-password", 401);
}

async function saveInitialAdminPin(context: Awaited<ReturnType<typeof getTeamEntryContext>>, pin: string) {
  const existing = context.payload.config?.security?.configAccess || {};
  if (existing.pinHash || existing.password) throw new WorkspaceError("admin-pin-already-configured", 409);
  const payload = {
    ...context.payload,
    config: {
      ...(context.payload.config || {}),
      security: { ...(context.payload.config?.security || {}), configAccess: { mode: "open", pinHash: hashPin(pin) } },
    },
  };
  const table = context.admin.from("graficalc_runtime_state");
  const row = { tenant_id: context.tenantId, payload, updated_at: new Date().toISOString() };
  const result = context.updatedAt
    ? await table.update(row).eq("tenant_id", context.tenantId).eq("updated_at", context.updatedAt).select("updated_at").maybeSingle()
    : await table.insert(row).select("updated_at").maybeSingle();
  if (result.error?.code === "23505" || (!result.error && !result.data)) throw new WorkspaceError("workspace-conflict", 409);
  if (result.error) throw new WorkspaceError("workspace-write-failed", 503);
}

export async function GET() {
  try {
    const context = await getTeamEntryContext();
    return Response.json({ ok: true, adminPinConfigured: context.adminPinConfigured, employees: context.employees }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) { return workspaceError(error); }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getTeamEntryContext();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new WorkspaceError("invalid-access-pin", 400);
    const { admin, user, tenantId } = context;

    if (parsed.data.mode === "employee") {
      const rateKey = `employee-pin:${tenantId}:${parsed.data.employeeId}`;
      if (!await beginAuthAttempt(admin, rateKey)) throw new WorkspaceError("too-many-attempts", 429);
      const [{ data: employee, error: employeeError }, { data: credential, error: pinError }] = await Promise.all([
        admin.from("profiles").select("id,nome").eq("id", parsed.data.employeeId).eq("tenant_id", tenantId).eq("papel", "funcionario").maybeSingle(),
        admin.from("graficalc_employee_pins").select("pin_salt,pin_hash,pin_version,active").eq("tenant_id", tenantId).eq("user_id", parsed.data.employeeId).maybeSingle(),
      ]);
      if (employeeError || pinError) throw new WorkspaceError("employee-session-unavailable", 503);
      if (!employee || !credential?.active || !verifyEmployeePin(parsed.data.pin, credential.pin_salt, credential.pin_hash)) {
        throw new WorkspaceError("invalid-access-pin", 401);
      }
      await admin.rpc("graficalc_clear_auth_failures", { p_key: rateKey });
      const cookieJar = await cookies();
      cookieJar.set(EMPLOYEE_MODE_COOKIE, createEmployeeModeSession({ ownerId: user.id, tenantId, employeeId: employee.id, pinVersion: Number(credential.pin_version) }), employeeModeCookieOptions());
      cookieJar.set(EMPLOYEE_LOCK_COOKIE, createEmployeeLock(user.id, tenantId), employeeLockCookieOptions());
      cookieJar.delete(ADMIN_MODE_COOKIE);
      return Response.json({ ok: true, mode: "employee", employee: { id: employee.id, name: employee.nome } }, { headers: { "Cache-Control": "private, no-store" } });
    }

    const rateKey = `owner-access-pin:${tenantId}:${user.id}`;
    if (!await beginAuthAttempt(admin, rateKey)) throw new WorkspaceError("too-many-attempts", 429);
    let pinValue = context.adminPinValue;
    if (parsed.data.mode === "setup-admin") {
      if (context.adminPinConfigured) throw new WorkspaceError("admin-pin-already-configured", 409);
      if (!validPin(parsed.data.pin)) throw new WorkspaceError("invalid-access-pin", 400);
      await verifyOwnerPassword(user.email || "", parsed.data.password);
      await saveInitialAdminPin(context, parsed.data.pin);
      pinValue = hashPin(parsed.data.pin);
    } else {
      if (!context.adminPinConfigured || !matchesCurrentPin(parsed.data.pin, context.adminPin)) {
        throw new WorkspaceError("invalid-access-pin", 401);
      }
    }
    const { error: clearError } = await admin.rpc("graficalc_clear_auth_failures", { p_key: rateKey });
    if (clearError) throw new WorkspaceError("rate-limit-unavailable", 503);
    const cookieJar = await cookies();
    cookieJar.set(ADMIN_MODE_COOKIE, createAdminModeSession(user.id, tenantId, pinValue), adminModeCookieOptions());
    cookieJar.delete(EMPLOYEE_MODE_COOKIE);
    cookieJar.delete(EMPLOYEE_LOCK_COOKIE);
    return Response.json({ ok: true, mode: "admin" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}

export async function DELETE(request: Request) {
  try {
    assertSameOrigin(request);
    const context = await getTeamEntryContext();
    const cookieJar = await cookies();
    cookieJar.delete(ADMIN_MODE_COOKIE);
    cookieJar.delete(EMPLOYEE_MODE_COOKIE);
    cookieJar.set(EMPLOYEE_LOCK_COOKIE, createEmployeeLock(context.user.id, context.tenantId), employeeLockCookieOptions());
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return workspaceError(error); }
}
