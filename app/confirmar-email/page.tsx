import Link from "next/link";
import { resendConfirmationAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { Turnstile } from "@/components/auth/turnstile";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; erro?: string }> }) {
  const { email = "", erro = "" } = await searchParams;
  return <AuthShell eyebrow="Verificação" title="Confirme seu e-mail" description="Abra a mensagem enviada pelo Supabase e clique no botão de confirmação.">
    <div className="confirmation-card"><strong>Cadastro recebido</strong><p>O acesso ao GrafiCalc será liberado somente depois que o endereço de e-mail for confirmado.</p>{erro && <p className="form-message error">Este link já foi usado ou expirou. Se o e-mail já foi confirmado, volte ao login. Caso contrário, solicite um novo link abaixo.</p>}</div>
    <ActionForm action={resendConfirmationAction} buttonLabel="Reenviar confirmação" pendingLabel="Reenviando...">
      <label className="field"><span>E-mail cadastrado</span><input name="email" type="email" defaultValue={email} required /></label>
      <Turnstile />
    </ActionForm>
    <p className="form-footer"><Link href="/entrar">Voltar ao login</Link></p>
  </AuthShell>;
}
