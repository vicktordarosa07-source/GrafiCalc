import { NextResponse } from "next/server";
import { getSupabaseServerEnvironment } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

// Exposes only public configuration state to diagnose a mismatched Vercel setup.
export async function GET() {
  const { url: supabaseUrl, publishableKey, secretKey } = getSupabaseServerEnvironment();
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
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
