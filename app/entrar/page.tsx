import { LoginBrowserForm } from "@/components/auth/login-browser-form";
import { AuthShell } from "@/components/layout/auth-shell";

const messages: Record<string, string> = {
  seguranca: "Conclua a verificação de segurança antes de entrar.",
  campos: "Informe um e-mail e uma senha válidos.",
  credenciais: "E-mail ou senha inválidos.",
  confirmacao: "Confirme seu e-mail antes de entrar.",
  limite: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.",
  "configuracao-admin": "A chave administrativa do Supabase não está disponível na Vercel.",
  "configuracao-publica": "A URL ou a chave publicável do Supabase não está disponível na Vercel.",
  "configuracao-auth": "O encaminhamento de IP do Supabase não está pronto no servidor. Verifique a chave secreta, o IP encaminhado e a opção de IP forwarding do projeto.",
  "chave-publica-invalida": "A chave pública do Supabase na Vercel não pertence a este projeto ou está incompleta. Atualize SUPABASE_PUBLISHABLE_KEY.",
  "rate-limit": "A proteção contra tentativas está indisponível. Verifique a chave administrativa do Supabase na Vercel.",
  "cliente-supabase": "Não foi possível preparar a conexão segura com o Supabase.",
  "conexao-supabase": "A Vercel não conseguiu alcançar a autenticação do Supabase. Verifique a URL e a chave publicável.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; confirmado?: string }> }) {
  const { erro, confirmado } = await searchParams;
  const message = erro ? messages[erro] : undefined;

  return (
    <AuthShell
      eyebrow="Acesso seguro"
      title="Entrar no GrafiCalc"
      description="Use seu e-mail e senha para abrir sua área de trabalho."
    >
      <LoginBrowserForm message={message} successMessage={confirmado === "1" ? "E-mail confirmado. Agora entre com seu e-mail e senha." : undefined} />
    </AuthShell>
  );
}
