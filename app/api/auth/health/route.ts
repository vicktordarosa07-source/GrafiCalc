import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Exposes only public configuration state to diagnose a mismatched Vercel setup.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let projectRef: string | null = null;

  try {
    projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] || null : null;
  } catch {
    projectRef = "invalid-url";
  }

  return NextResponse.json({
    status: "ok",
    supabaseProject: projectRef,
    publicKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    adminKeyConfigured: Boolean(process.env.SUPABASE_SECRET_KEY),
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
