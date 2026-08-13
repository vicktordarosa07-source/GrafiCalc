import Link from "next/link";
import { AuthShell } from "@/components/layout/auth-shell";

const messages: Record<string, string> = {
  campos: "Informe um e-mail e uma senha válidos.",
  credenciais: "E-mail ou senha inválidos.",
  confirmacao: "Confirme seu e-mail antes de entrar.",
  limite: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
  "configuracao-admin": "A chave administrativa do Supabase não está disponível na Vercel.",
  "configuracao-publica": "A URL ou a chave publicável do Supabase não está disponível na Vercel.",
  "rate-limit": "A proteção contra tentativas está indisponível. Verifique a chave administrativa do Supabase na Vercel.",
  "cliente-supabase": "Não foi possível preparar a conexão segura com o Supabase.",
  "conexao-supabase": "A Vercel não conseguiu alcançar a autenticação do Supabase. Verifique a URL e a chave publicável.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const message = erro ? messages[erro] : undefined;

  return (
    <AuthShell eyebrow="Acesso seguro" title="Entrar no GrafiCalc" description="Use seu e-mail e senha para abrir sua área de trabalho.">
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
