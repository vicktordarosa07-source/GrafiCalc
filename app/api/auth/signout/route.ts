import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { DEVELOPER_COOKIE } from "@/lib/developer-session";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).set(DEVELOPER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
