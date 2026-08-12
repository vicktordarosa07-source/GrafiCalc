import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/entrar", "/cadastro", "/recuperar-senha", "/confirmar-email", "/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // A deployment without Supabase must never expose the legacy calculator or private APIs.
  if (!url || !key) {
    if (isPublic) return response;
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/entrar";
    loginUrl.searchParams.set("erro", "configuracao");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/entrar";
    loginUrl.searchParams.set("retorno", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/entrar") {
    const target = request.nextUrl.clone();
    target.pathname = user.email_confirmed_at ? "/workspace" : "/confirmar-email";
    target.search = "";
    return NextResponse.redirect(target);
  }

  if (user && !user.email_confirmed_at && !isPublic) {
    const confirmationUrl = request.nextUrl.clone();
    confirmationUrl.pathname = "/confirmar-email";
    confirmationUrl.search = "";
    return NextResponse.redirect(confirmationUrl);
  }

  return response;
}
