import Link from "next/link";
import { confirmSupabaseLinkAction, resendConfirmationAction, verifyEmailOtpAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { Turnstile } from "@/components/auth/turnstile";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; erro?: string; token_hash?: string; type?: string; code?: string; next?: string }> }) {
  const { email = "", erro = "", token_hash = "", type = "", code = "", next = "" } = await searchParams;
  const hasPendingLink = Boolean((token_hash && type) || code);
  const isPasswordRecovery = next === "/alterar-senha";
  const title = isPasswordRecovery ? "Redefinir sua senha" : "Confirmar seu e-mail";
  const actionLabel = isPasswordRecovery ? "Continuar para nova senha" : "Confirmar e-mail";

  return <AuthShell eyebrow="Verificação" title={title} description="Use o código enviado por e-mail para concluir esta ação com segurança.">
    {hasPendingLink && <>
      <div className="confirmation-card">
        <strong>Link de modelo antigo recebido</strong>
        <p>Você ainda pode tentar concluir este link. Para evitar expirações futuras, use o código enviado por e-mail.</p>
      </div>
      <ActionForm action={confirmSupabaseLinkAction} buttonLabel={actionLabel} pendingLabel="Confirmando...">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type} />
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="next" value={next} />
      </ActionForm>
    </>}

    <div className="confirmation-card"><strong>{isPasswordRecovery ? "Recuperação de senha" : "Cadastro recebido"}</strong><p>{isPasswordRecovery ? "Digite o código enviado para o seu e-mail. Ele libera a criação da nova senha." : "Digite o código enviado para o seu e-mail. O acesso será liberado depois da confirmação."}</p>{erro && <p className="form-message error">Este link já foi usado ou expirou. Solicite um novo e-mail e use o código recebido.</p>}</div>
    <ActionForm action={verifyEmailOtpAction} buttonLabel={actionLabel} pendingLabel="Confirmando...">
      <input type="hidden" name="next" value={next} />
      <label className="field"><span>E-mail cadastrado</span><input name="email" type="email" defaultValue={email} autoComplete="email" required /></label>
      <label className="field"><span>Código de confirmação</span><input name="token" inputMode="numeric" pattern="[0-9]{6,8}" autoComplete="one-time-code" maxLength={8} required /></label>
    </ActionForm>
    {!isPasswordRecovery && <ActionForm action={resendConfirmationAction} buttonLabel="Reenviar confirmação" pendingLabel="Reenviando...">
      <label className="field"><span>Não recebeu o código? Informe seu e-mail</span><input name="email" type="email" defaultValue={email} autoComplete="email" required /></label>
      <Turnstile />
    </ActionForm>}
    <p className="form-footer"><Link href={isPasswordRecovery ? "/recuperar-senha" : "/entrar"}>Voltar</Link></p>
  </AuthShell>;
}
