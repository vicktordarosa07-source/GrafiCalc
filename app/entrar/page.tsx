import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";

const messages: Record<string, string> = {
  campos: "Informe um e-mail e uma senha vÃ¡lidos.",
  credenciais: "E-mail ou senha invÃ¡lidos.",
  confirmacao: "Confirme seu e-mail antes de entrar.",
  limite: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
  configuracao: "A autenticaÃ§Ã£o ainda nÃ£o estÃ¡ configurada corretamente.",
  "rate-limit": "A proteÃ§Ã£o contra tentativas estÃ¡ indisponÃ­vel. Verifique a chave administrativa do Supabase na Vercel.",
  autenticacao: "NÃ£o foi possÃ­vel concluir a autenticaÃ§Ã£o. Tente novamente em instantes.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const message = erro ? messages[erro] : undefined;

  return (
    <AuthShell eyebrow="Acesso seguro" title="Entrar no GrafiCalc" description="Use seu e-mail e senha para abrir sua Ã¡rea de trabalho.">
      <form className="auth-form" action="/api/auth/login" method="post">
        <label className="field"><span>E-mail</span><input type="email" name="email" autoComplete="email" required /></label>
        <label className="field"><span>Senha</span><input type="password" name="password" autoComplete="current-password" required /></label>
        {message && <p className="form-message error" role="alert">{message}</p>}
        <button className="button button-primary" type="submit">Entrar</button>
        <div className="form-links"><Link href="/recuperar-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar cadastro</Link></div>
      </form>
    </AuthShell>
  );
}
