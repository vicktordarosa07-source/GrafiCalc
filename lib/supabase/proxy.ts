import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";
import { isRememberSession, sessionCookieOptions } from "@/lib/supabase/session-cookie";
import { ADMIN_MODE_COOKIE, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE, readAdminModeSession, readEmployeeLock, readEmployeeModeSession } from "@/lib/employee-mode";

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
      cookieOptions: { maxAge: isRememberSession(request.cookies) ? 30 * 24 * 60 * 60 : undefined },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: forwardedRequestHeaders() } });
          const remember = isRememberSession(request.cookies);
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, sessionCookieOptions(options, remember)));
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

    const lock = readEmployeeLock(request.cookies.get(EMPLOYEE_LOCK_COOKIE)?.value);
    if (lock?.ownerId === user.id) {
      const employeeMode = readEmployeeModeSession(request.cookies.get(EMPLOYEE_MODE_COOKIE)?.value);
      const adminMode = readAdminModeSession(request.cookies.get(ADMIN_MODE_COOKIE)?.value);
      const validEmployee = employeeMode?.ownerId === user.id && employeeMode.tenantId === lock.tenantId;
      const validAdmin = adminMode?.ownerId === user.id && adminMode.tenantId === lock.tenantId;
      const entryEndpoint = pathname === "/api/team/access-mode" || pathname === "/api/auth/signout";
      if (!validEmployee && !validAdmin && !entryEndpoint && pathname !== "/workspace") {
        if (pathname.startsWith("/api/")) return applySecurityHeaders(NextResponse.json({ ok: false, error: "workspace-access-mode-required" }, { status: 423, headers: { "Cache-Control": "private, no-store" } }));
        const entryUrl = request.nextUrl.clone();
        entryUrl.pathname = "/workspace";
        entryUrl.search = "";
        return applySecurityHeaders(NextResponse.redirect(entryUrl));
      }
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
