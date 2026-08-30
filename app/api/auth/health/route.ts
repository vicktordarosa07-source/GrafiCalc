import { NextResponse } from "next/server";
import { getSupabaseServerEnvironment, getSupabaseServerEnvironmentStatus } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

// Exposes only public configuration state to diagnose a mismatched Vercel setup.
export async function GET() {
  const { url: supabaseUrl, publishableKey, secretKey } = getSupabaseServerEnvironment();
  const environmentStatus = getSupabaseServerEnvironmentStatus();
  let projectRef: string | null = null;

  try {
    projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] || null : null;
  } catch {
    projectRef = "invalid-url";
  }

  return NextResponse.json({
    status: "ok",
    supabaseProject: projectRef,
    publicKeyConfigured: Boolean(publishableKey),
    adminKeyConfigured: Boolean(secretKey),
    turnstileSiteKeyConfigured: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
    ...environmentStatus,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
