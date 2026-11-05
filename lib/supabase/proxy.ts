import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";

const PUBLIC_PATHS = ["/entrar", "/cadastro", "/recuperar-senha", "/confirmar-email", "/auth", "/api/auth/login", "/api/auth/health", "/api/billing/webhook", "/api/billing/worker"];

type ProxySecurityHeaders = {
  nonce: string;
  contentSecurityPolicy: string;
};

export async function updateSession(request: NextRequest, security: ProxySecurityHeaders) {
  const forwardedRequestHeaders = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", security.nonce);
    headers.set("Content-Security-Policy", security.contentSecurityPolicy);
    return headers;
  };
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", security.contentSecurityPolicy);
    return response;
  };
  let response = NextResponse.next({ request: { headers: forwardedRequestHeaders() } });
  const { url, publishableKey: key } = getSupabaseServerEnvironment();
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // A deployment without Supabase must never expose the legacy calculator or private APIs.
  if (!url || !key) {
    if (isPublic) return applySecurityHeaders(response);
    if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.json({ error: "security-not-configured" }, { status: 503 }));
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/entrar";
    loginUrl.searchParams.set("erro", "configuracao");
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // Public pages must remain reachable even while Supabase is unavailable or
  // an environment variable was published with an invalid value. Private
  // routes continue to fail closed below.
  if (isPublic) return applySecurityHeaders(response);

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: forwardedRequestHeaders() } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } }));
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/entrar";
      loginUrl.searchParams.set("retorno", pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }

    if (!user.email_confirmed_at) {
      if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.json({ error: "email-unconfirmed" }, { status: 403 }));
      const confirmationUrl = request.nextUrl.clone();
      confirmationUrl.pathname = "/confirmar-email";
      confirmationUrl.search = "";
      return applySecurityHeaders(NextResponse.redirect(confirmationUrl));
    }

    return applySecurityHeaders(response);
  } catch {
    if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.json({ error: "authentication-unavailable" }, { status: 503 }));
    // Do not expose a proxy exception or let the request reach private pages.
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/entrar";
    loginUrl.searchParams.set("erro", "configuracao");
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }
}
