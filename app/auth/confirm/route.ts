import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { type EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";

function isSupportedType(value: string): value is EmailOtpType {
  return value === "signup" || value === "recovery";
}

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url);
  const next = sourceUrl.searchParams.get("next") === "/alterar-senha" ? "/alterar-senha" : "/entrar?confirmado=1";
  const errorUrl = new URL("/entrar?erro=confirmacao", sourceUrl.origin);
  const { url, publishableKey } = getSupabaseServerEnvironment();
  if (!url || !publishableKey) return NextResponse.redirect(errorUrl);

  const response = NextResponse.redirect(new URL(next, sourceUrl.origin));
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.headers.get("cookie")
        ?.split("; ")
        .filter(Boolean)
        .map((item) => {
          const index = item.indexOf("=");
          return { name: index >= 0 ? item.slice(0, index) : item, value: index >= 0 ? item.slice(index + 1) : "" };
        }) || [],
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const tokenHash = sourceUrl.searchParams.get("token_hash") || "";
  const type = sourceUrl.searchParams.get("type") || "";
  const code = sourceUrl.searchParams.get("code") || "";
  const result = tokenHash && isSupportedType(type)
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("missing-confirmation-token") };

  if (result.error) {
    return NextResponse.redirect(errorUrl);
  }
  return response;
}
