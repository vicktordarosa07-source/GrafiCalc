import Image from "next/image";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="brand-panel">
        <Image src="/brand/logo-graficalc-login.png" alt="GrafiCalc" width={980} height={229} priority />
        <div className="brand-copy"><span>Plataforma profissional para gráficas</span><h1>Centralize orçamentos, clientes e produção.</h1><p>Ganhe velocidade no balcão, padronize seus preços e acompanhe resultados com clareza.</p></div>
      </section>
      <section className="form-panel"><div className="form-heading"><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{children}</section>
    </main>
  );
}
