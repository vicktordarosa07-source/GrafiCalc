import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,nome,empresa,cpf_cnpj,email,papel,criado_em")
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
  };

  return Response.json(safeProfile, { headers: { "Cache-Control": "no-store" } });
}
