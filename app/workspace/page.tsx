import Link from "next/link";
import { redirect } from "next/navigation";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { createClient } from "@/lib/supabase/server";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return <main className="workspace-shell"><InactivityGuard /><div className="workspace-bar"><span>GrafiCalc seguro</span><Link href="/perfil">Minha conta</Link></div><iframe title="Área de trabalho GrafiCalc" src="/legacy/index.html" /></main>;
}
