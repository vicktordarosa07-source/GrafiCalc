import Link from "next/link";
import { confirmSupabaseLinkAction, resendConfirmationAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { Turnstile } from "@/components/auth/turnstile";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; erro?: string; token_hash?: string; type?: string; code?: string; next?: string }> }) {
  const { email = "", erro = "", token_hash = "", type = "", code = "", next = "" } = await searchParams;
  const hasPendingLink = Boolean((token_hash && type) || code);
  const isPasswordRecovery = next === "/alterar-senha";

  if (hasPendingLink) {
    return <AuthShell eyebrow="Verificação" title={isPasswordRecovery ? "Redefinir sua senha" : "Confirmar seu e-mail"} description="Para sua segurança, confirme esta ação antes de continuarmos.">
      <div className="confirmation-card">
        <strong>{isPasswordRecovery ? "Link de recuperação recebido" : "Link de confirmação recebido"}</strong>
        <p>O link ainda não foi usado. Clique no botão abaixo para concluir com segurança.</p>
      </div>
      <ActionForm action={confirmSupabaseLinkAction} buttonLabel={isPasswordRecovery ? "Continuar para nova senha" : "Confirmar e-mail"} pendingLabel="Confirmando...">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="next" value={next} />
      </ActionForm>
      <p className="form-footer"><Link href={isPasswordRecovery ? "/recuperar-senha" : "/entrar"}>Voltar</Link></p>
    </AuthShell>;
  }

  return <AuthShell eyebrow="Verificação" title="Confirme seu e-mail" description="Abra a mensagem enviada pelo Supabase e clique no botão de confirmação.">
    <div className="confirmation-card"><strong>Cadastro recebido</strong><p>O acesso ao GrafiCalc será liberado somente depois que o endereço de e-mail for confirmado.</p>{erro && <p className="form-message error">Este link já foi usado ou expirou. Se o e-mail já foi confirmado, volte ao login. Caso contrário, solicite um novo link abaixo.</p>}</div>
    <ActionForm action={resendConfirmationAction} buttonLabel="Reenviar confirmação" pendingLabel="Reenviando...">
      <label className="field"><span>E-mail cadastrado</span><input name="email" type="email" defaultValue={email} required /></label>
      <Turnstile />
    </ActionForm>
    <p className="form-footer"><Link href="/entrar">Voltar ao login</Link></p>
  </AuthShell>;
}
