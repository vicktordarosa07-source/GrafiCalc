import Link from "next/link";
import { redirect } from "next/navigation";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { WorkspaceAccessGate } from "@/components/auth/workspace-access-gate";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/workspace";
import { getBillingAccess } from "@/lib/billing/access";
import { WorkspaceError } from "@/lib/workspace-policy";

export default async function WorkspacePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  let context: Awaited<ReturnType<typeof getWorkspaceContext>>;
  try { context = await getWorkspaceContext(); }
  catch (error) {
    if (error instanceof WorkspaceError && ["employee-owner-unlock-required", "workspace-access-mode-required"].includes(error.message)) {
      return <main className="workspace-shell"><WorkspaceAccessGate /></main>;
    }
    throw error;
  }
  if (!context) redirect("/entrar");
  let billingAllowed = true;
  try { billingAllowed = (await getBillingAccess(context.admin, context.tenantId)).allowed; }
  catch { redirect("/assinatura?erro=indisponivel"); }
  if (!billingAllowed) redirect("/assinatura?acesso=restrito");
  return <main className="workspace-shell"><InactivityGuard pinLockOnIdle={context.ownerIsLeader} /><div className="workspace-bar">{!context.employeeMode && <Link href="/assinatura">Assinatura</Link>}<Link href="/perfil">Minha conta</Link></div><iframe title="Área de trabalho GrafiCalc" src="/legacy/index.html?v=20261106-compact-workspace" /></main>;
}
