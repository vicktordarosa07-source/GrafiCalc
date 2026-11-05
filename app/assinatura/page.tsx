import Link from "next/link";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { SubscriptionPanel } from "@/components/billing/subscription-panel";
import { showWorkspaceReturnLink } from "@/lib/billing/navigation";

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ acesso?: string | string[] }>;
}) {
  const { acesso } = await searchParams;
  const canReturnToWorkspace = showWorkspaceReturnLink(acesso);

  return <main className="subscription-page">
    <InactivityGuard />
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
