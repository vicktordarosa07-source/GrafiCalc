import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { getTrustedClientIp, resolveSupabaseAuthClientConfig } from "@/lib/supabase/auth-ip-forwarding";
import { loginSchema } from "@/lib/validation/auth";
import { beginAuthAttempt } from "@/lib/supabase/auth-rate-limit";
import { REMEMBER_SESSION_COOKIE, REMEMBER_SESSION_SECONDS, sessionCookieOptions } from "@/lib/supabase/session-cookie";
import { createEmployeeLock, employeeLockCookieOptions, EMPLOYEE_LOCK_COOKIE } from "@/lib/employee-mode";

export const dynamic = "force-dynamic";

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL("/entrar", request.url);
  url.searchParams.set("erro", error);
  return NextResponse.redirect(url, { status: 303 });
}

function loginErrorCode(error: { message?: string; status?: number }) {
  const detail = error.message?.toLowerCase() || "";
  if (/invalid api key|api key.*invalid|apikey/.test(detail)) return "chave-publica-invalida";
  if (/captcha|turnstile|security check/.test(detail)) return "seguranca";
  if (/email not confirmed|email.*confirm/.test(detail)) return "confirmacao";
  if (/rate limit|too many|over.*limit/.test(detail)) return "limite";
  if (/network|fetch|timeout|connection/.test(detail) || error.status === 0) return "conexao-supabase";
  return "credenciais";
}

async function clearFailedAttempts(admin: ReturnType<typeof createAdminClient> | null, key: string) {
  if (!admin) return;

  try {
    await admin.rpc("graficalc_clear_auth_failures", { p_key: key });
  } catch (error) {
    // A successful authentication remains valid even if the audit cleanup is unavailable.
    console.error("graficalc_login_audit_cleanup_failure", { message: error instanceof Error ? error.message : "unknown" });
  }
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const rememberSession = formData.get("remember") === "1";
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    captchaToken: formData.get("cf-turnstile-response") || formData.get("captchaToken") || undefined,
  });
  if (!parsed.success) return redirectToLogin(request, "campos");

  const ip = getTrustedClientIp(request.headers) || "unknown";
  const rateLimitKey = `${ip}:${parsed.data.email.toLowerCase()}`;

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("graficalc_login_admin_client_failure", { message: error instanceof Error ? error.message : "unknown" });
  }

  if (!admin) {
    console.error("graficalc_login_rate_limit_unavailable");
    return redirectToLogin(request, "rate-limit");
  }

  try {
    const allowed = await beginAuthAttempt(admin, rateLimitKey);
    if (!allowed) {
      return redirectToLogin(request, "limite");
    }
  } catch (error) {
    console.error("graficalc_login_rate_limit_exception", { message: error instanceof Error ? error.message : "unknown" });
    return redirectToLogin(request, "rate-limit");
  }

  const environment = getSupabaseServerEnvironment();
  const forwardClientIp = process.env.SUPABASE_AUTH_IP_FORWARDING_ENABLED?.trim().toLowerCase() === "true";
  const authClientConfig = resolveSupabaseAuthClientConfig({
    forwardClientIp,
    clientIp: ip === "unknown" ? null : ip,
    secretKey: environment.secretKey,
    publishableKey: environment.publishableKey,
  });
  if (!environment.url || !authClientConfig.ok) {
    console.error("graficalc_login_supabase_configuration", {
      urlConfigured: Boolean(environment.url),
      reason: authClientConfig.ok ? "unknown" : authClientConfig.reason,
    });
    return redirectToLogin(request, forwardClientIp ? "configuracao-auth" : "configuracao-publica");
  }

  const response = NextResponse.redirect(new URL("/workspace", request.url), { status: 303 });
  let supabase: ReturnType<typeof createServerClient>;
  try {
    supabase = createServerClient(environment.url, authClientConfig.apiKey, {
      ...(authClientConfig.forwardedFor
        ? { global: { headers: { "Sb-Forwarded-For": authClientConfig.forwardedFor } } }
        : {}),
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookieOptions(options, rememberSession)));
        },
      },
    });
  } catch (error) {
    console.error("graficalc_login_public_client_failure", { message: error instanceof Error ? error.message : "unknown" });
    return redirectToLogin(request, "cliente-supabase");
  }

  let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  try {
    result = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
      options: parsed.data.captchaToken ? { captchaToken: parsed.data.captchaToken } : undefined,
    });
  } catch (error) {
    console.error("graficalc_login_auth_request_failure", { message: error instanceof Error ? error.message : "unknown" });
    return redirectToLogin(request, "conexao-supabase");
  }

  if (result.error || !result.data.user) {
    if (result.error) {
      console.error("graficalc_login_rejected", { message: result.error.message, status: result.error.status });
    }
    return redirectToLogin(request, loginErrorCode(result.error || {}));
  }
  if (!result.data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    return redirectToLogin(request, "confirmacao");
  }

  await clearFailedAttempts(admin, rateLimitKey);
  if (rememberSession) {
    response.cookies.set(REMEMBER_SESSION_COOKIE, "1", {
      path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: REMEMBER_SESSION_SECONDS,
    });
  } else {
    response.cookies.set(REMEMBER_SESSION_COOKIE, "", {
      path: "/", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 0,
    });
  }
  try {
    const { data: profile } = await admin.from("profiles").select("tenant_id").eq("id", result.data.user.id).maybeSingle();
    if (profile?.tenant_id) {
      const { data: tenant } = await admin.from("graficalc_tenants").select("id,owner_id").eq("id", profile.tenant_id).maybeSingle();
      if (tenant && tenant.owner_id === result.data.user.id) {
        response.cookies.set(EMPLOYEE_LOCK_COOKIE, createEmployeeLock(result.data.user.id, String(tenant.id)), employeeLockCookieOptions());
      }
    }
  } catch (error) {
    console.error("graficalc_owner_pin_gate_initialization_failure", { message: error instanceof Error ? error.message : "unknown" });
  }
  return response;
}
