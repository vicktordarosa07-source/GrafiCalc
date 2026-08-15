import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validation/auth";

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL("/entrar", request.url);
  url.searchParams.set("erro", error);
  return NextResponse.redirect(url, { status: 303 });
}

function loginErrorCode(error: { message?: string; status?: number }) {
  const detail = error.message?.toLowerCase() || "";
  if (/invalid api key|api key.*invalid|apikey/.test(detail)) return "configuracao-publica";
  if (/captcha|turnstile|security check/.test(detail)) return "seguranca";
  if (/email not confirmed|email.*confirm/.test(detail)) return "confirmacao";
  if (/rate limit|too many|over.*limit/.test(detail)) return "limite";
  if (/network|fetch|timeout|connection/.test(detail) || error.status === 0) return "conexao-supabase";
  return "credenciais";
}

async function recordFailedAttempt(admin: ReturnType<typeof createAdminClient> | null, key: string) {
  if (!admin) return;

  try {
    await admin.rpc("graficalc_record_auth_failure", { p_key: key });
  } catch (error) {
    // The audit must never turn an invalid credential into an application failure.
    console.error("graficalc_login_audit_failure", { message: error instanceof Error ? error.message : "unknown" });
  }
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
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    captchaToken: formData.get("cf-turnstile-response") || formData.get("captchaToken") || undefined,
  });
  if (!parsed.success) return redirectToLogin(request, "campos");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `${ip}:${parsed.data.email.toLowerCase()}`;

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("graficalc_login_admin_client_failure", { message: error instanceof Error ? error.message : "unknown" });
  }

  if (admin) {
    try {
      const { data: allowed, error: limitError } = await admin.rpc("graficalc_auth_attempt_allowed", { p_key: rateLimitKey });
      if (limitError) {
        console.error("graficalc_login_rate_limit_failure", { message: limitError.message });
      } else if (!allowed) {
        return redirectToLogin(request, "limite");
      }
    } catch (error) {
      console.error("graficalc_login_rate_limit_exception", { message: error instanceof Error ? error.message : "unknown" });
    }
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return redirectToLogin(request, "configuracao-publica");

  const response = NextResponse.redirect(new URL("/workspace", request.url), { status: 303 });
  let supabase: ReturnType<typeof createServerClient>;
  try {
    supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
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
    await recordFailedAttempt(admin, rateLimitKey);
    if (result.error) {
      console.error("graficalc_login_rejected", { message: result.error.message, status: result.error.status });
    }
    return redirectToLogin(request, loginErrorCode(result.error || {}));
  }
  if (!result.data.user.email_confirmed_at) {
    await recordFailedAttempt(admin, rateLimitKey);
    await supabase.auth.signOut();
    return redirectToLogin(request, "confirmacao");
  }

  await clearFailedAttempts(admin, rateLimitKey);
  return response;
}
