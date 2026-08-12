import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("id,nome,empresa,cpf_cnpj,email,papel,criado_em").eq("id", user.id).single();
  if (!profile) return Response.json({ error: "profile-not-found" }, { status: 404 });
  return Response.json(profile, { headers: { "Cache-Control": "no-store" } });
}
