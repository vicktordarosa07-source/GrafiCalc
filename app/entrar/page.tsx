import { LoginBrowserForm } from "@/components/auth/login-browser-form";
import { AuthShell } from "@/components/layout/auth-shell";

const messages: Record<string, string> = {
  seguranca: "Conclua a verificacao de seguranca antes de entrar.",
  campos: "Informe um e-mail e uma senha validos.",
  credenciais: "E-mail ou senha invalidos.",
  confirmacao: "Confirme seu e-mail antes de entrar.",
  limite: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
  "configuracao-admin": "A chave administrativa do Supabase nao esta disponivel na Vercel.",
  "configuracao-publica": "A URL ou a chave publicavel do Supabase nao esta disponivel na Vercel.",
  "chave-publica-invalida": "A chave publica do Supabase na Vercel nao pertence a este projeto ou esta incompleta. Atualize SUPABASE_PUBLISHABLE_KEY.",
  "rate-limit": "A protecao contra tentativas esta indisponivel. Verifique a chave administrativa do Supabase na Vercel.",
  "cliente-supabase": "Nao foi possivel preparar a conexao segura com o Supabase.",
  "conexao-supabase": "A Vercel nao conseguiu alcancar a autenticacao do Supabase. Verifique a URL e a chave publicavel.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const message = erro ? messages[erro] : undefined;

  return (
    <AuthShell
      eyebrow="Acesso seguro"
      title="Entrar no GrafiCalc"
      description="Use seu e-mail e senha para abrir sua area de trabalho."
    >
      <LoginBrowserForm message={message} />
    </AuthShell>
  );
}
