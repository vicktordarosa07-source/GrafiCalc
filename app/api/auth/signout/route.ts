import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { DEVELOPER_COOKIE } from "@/lib/developer-session";
import { CONFIG_PIN_COOKIE } from "@/lib/config-pin";
import { ADMIN_MODE_COOKIE, EMPLOYEE_LOCK_COOKIE, EMPLOYEE_MODE_COOKIE } from "@/lib/employee-mode";
import { REMEMBER_SESSION_COOKIE } from "@/lib/supabase/session-cookie";
import { assertSameOrigin } from "@/lib/workspace-policy";
import { workspaceError } from "@/lib/workspace";

export async function POST(request: Request) {
  try { assertSameOrigin(request); } catch (error) { return workspaceError(error); }
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  (await cookies()).set(DEVELOPER_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  (await cookies()).delete(CONFIG_PIN_COOKIE);
  (await cookies()).delete(EMPLOYEE_MODE_COOKIE);
  (await cookies()).delete(EMPLOYEE_LOCK_COOKIE);
  (await cookies()).delete(ADMIN_MODE_COOKIE);
  (await cookies()).delete(REMEMBER_SESSION_COOKIE);
  return Response.json({ ok: true });
}
