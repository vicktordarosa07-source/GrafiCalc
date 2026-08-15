import { LoginBrowserForm } from "@/components/auth/login-browser-form";
import { AuthShell } from "@/components/layout/auth-shell";

const messages: Record<string, string> = {
  seguranca: "Conclua a verificacao de seguranca antes de entrar.",
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
  return <AuthShell eyebrow="Acesso seguro" title="Entrar no GrafiCalc" description="Use seu e-mail e senha para abrir sua área de trabalho."><LoginBrowserForm message={message} /></AuthShell>;
}
