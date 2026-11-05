import Link from "next/link";
import { redirect } from "next/navigation";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getBillingAccess } from "@/lib/billing/access";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  const context = await getWorkspaceContext();
  if (!context) redirect("/entrar");
  let billingAllowed = true;
  try { billingAllowed = (await getBillingAccess(context.admin, context.tenantId)).allowed; }
  catch { redirect("/assinatura?erro=indisponivel"); }
  if (!billingAllowed) redirect("/assinatura?acesso=restrito");
  return <main className="workspace-shell"><InactivityGuard /><div className="workspace-bar"><Link href="/assinatura">Assinatura</Link><Link href="/perfil">Minha conta</Link></div><iframe title="Área de trabalho GrafiCalc" src="/legacy/index.html?v=20261105-brand-sync" /></main>;
}
