import type { NextRequest } from "next/server";
import { createContentSecurityPolicy, createLegacyContentSecurityPolicy } from "@/lib/security/csp";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const contentSecurityPolicy = request.nextUrl.pathname.startsWith("/legacy/")
    ? createLegacyContentSecurityPolicy(nonce, isDevelopment)
    : createContentSecurityPolicy(nonce, isDevelopment);
  return updateSession(request, { nonce, contentSecurityPolicy });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
