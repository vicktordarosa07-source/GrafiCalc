import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loginSchema } from "@/lib/validation/auth";

function redirectToLogin(request: NextRequest, error: string) {
  const url = new URL("/entrar", request.url);
  url.searchParams.set("erro", error);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return redirectToLogin(request, "campos");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimitKey = `${ip}:${parsed.data.email.toLowerCase()}`;

  try {
    const admin = createAdminClient();
    const { data: allowed, error: limitError } = await admin.rpc("graficalc_auth_attempt_allowed", { p_key: rateLimitKey });
    if (limitError) return redirectToLogin(request, "rate-limit");
    if (!allowed) return redirectToLogin(request, "limite");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return redirectToLogin(request, "configuracao");

    const response = NextResponse.redirect(new URL("/workspace", request.url), { status: 303 });
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });

    if (error || !data.user) {
      await admin.rpc("graficalc_record_auth_failure", { p_key: rateLimitKey });
      return redirectToLogin(request, "credenciais");
    }
    if (!data.user.email_confirmed_at) {
      await admin.rpc("graficalc_record_auth_failure", { p_key: rateLimitKey });
      await supabase.auth.signOut();
      return redirectToLogin(request, "confirmacao");
    }

    await admin.rpc("graficalc_clear_auth_failures", { p_key: rateLimitKey });
    return response;
  } catch (error) {
    if (error instanceof Error && error.message.includes("administrativo")) {
      return redirectToLogin(request, "configuracao");
    }
    return redirectToLogin(request, "autenticacao");
  }
}
