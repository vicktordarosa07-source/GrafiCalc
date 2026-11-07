import Link from "next/link";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { SubscriptionPanel } from "@/components/billing/subscription-panel";
import { showWorkspaceReturnLink } from "@/lib/billing/navigation";
import { getWorkspaceContext } from "@/lib/workspace";
import { WorkspaceError } from "@/lib/workspace-policy";
import { redirect } from "next/navigation";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ acesso?: string | string[] }>;
}) {
  try {
    const context = await getWorkspaceContext();
    if (!context || context.employeeMode || !context.ownerIsLeader) redirect("/workspace");
  } catch (error) {
    if (error instanceof WorkspaceError && ["workspace-access-mode-required", "employee-owner-unlock-required"].includes(error.message)) redirect("/workspace");
    throw error;
  }
  const { acesso } = await searchParams;
  const canReturnToWorkspace = showWorkspaceReturnLink(acesso);

  return <main className="subscription-page">
    <InactivityGuard pinLockOnIdle />
    <header className="subscription-topbar">
      {canReturnToWorkspace ? <Link href="/workspace">← Voltar ao GrafiCalc</Link> : <span>Regularização de assinatura</span>}
      {canReturnToWorkspace ? <span>GrafiCalc</span> : null}
    </header>
    <section className="subscription-hero">
      <p className="eyebrow">Conta e pagamentos</p>
      <h1>Assinatura</h1>
      <p>Consulte seu acesso, acompanhe cobranças e escolha um plano quando a contratação estiver habilitada.</p>
    </section>
    <SubscriptionPanel />
  </main>;
}
