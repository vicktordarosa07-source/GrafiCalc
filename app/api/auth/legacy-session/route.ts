import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVELOPER_EMAIL } from "@/lib/developer-session";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,tenant_id,nome,empresa,cpf_cnpj,email,papel,criado_em")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return Response.json({ error: "profile-query-failed" }, { status: 500 });
  }

  // Auth users created before the profiles migration must still reach the app.
  // This fallback intentionally grants only the regular subscription role.
  const safeProfile = profile ?? {
    id: user.id,
    nome: user.user_metadata.full_name || user.email?.split("@")[0] || "Usuario",
    empresa: user.user_metadata.empresa || "",
    cpf_cnpj: "",
    email: user.email || "",
    papel: "usuario",
    criado_em: user.created_at,
    tenant_id: "",
  };

  const admin = createAdminClient();
  const { data: tenant } = safeProfile.tenant_id
    ? await admin.from("graficalc_tenants").select("owner_id").eq("id", safeProfile.tenant_id).maybeSingle()
    : { data: null };

  return Response.json({
    ...safeProfile,
    teamLeader: String(user.email || "").trim().toLowerCase() === DEVELOPER_EMAIL || tenant?.owner_id === user.id,
  }, { headers: { "Cache-Control": "no-store" } });
}
