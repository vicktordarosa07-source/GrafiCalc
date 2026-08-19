import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const sourceUrl = new URL(request.url);
  const confirmationUrl = new URL("/confirmar-email", sourceUrl.origin);

  // E-mail clients and security scanners commonly prefetch links with GET.
  // Do not consume Supabase's one-time token until the user explicitly submits
  // the confirmation form on the destination page.
  for (const key of ["token_hash", "type", "code", "email", "next"]) {
    const value = sourceUrl.searchParams.get(key);
    if (value) confirmationUrl.searchParams.set(key, value);
  }

  return NextResponse.redirect(confirmationUrl);
}
