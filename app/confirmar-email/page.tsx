import Link from "next/link";
import { confirmSupabaseLinkAction, requestPasswordResetAction, resendConfirmationAction, verifyEmailOtpAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { Turnstile } from "@/components/auth/turnstile";
import { AuthShell } from "@/components/layout/auth-shell";

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ email?: string; erro?: string; token_hash?: string; type?: string; code?: string; next?: string }> }) {
  const { email = "", erro = "", token_hash = "", type = "", code = "", next = "" } = await searchParams;
  const hasPendingLink = Boolean((token_hash && type) || code);
  const isPasswordRecovery = next === "/alterar-senha";
  const title = isPasswordRecovery ? "Redefinir sua senha" : "Verifique seu e-mail";
  const actionLabel = isPasswordRecovery ? "Continuar para nova senha" : "Confirmar e-mail";
  const resendAction = isPasswordRecovery ? requestPasswordResetAction : resendConfirmationAction;
  const resendLabel = isPasswordRecovery ? "Reenviar código de recuperação" : "Reenviar confirmação";

  return <AuthShell eyebrow="Verificação" title={title} description={isPasswordRecovery ? "Use o código ou link enviado por e-mail para continuar com segurança." : "Abra o link enviado para o seu e-mail para liberar o acesso."}>
    {isPasswordRecovery && hasPendingLink && <>
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

    <div className="confirmation-card"><strong>{isPasswordRecovery ? "Recuperação de senha" : "Cadastro recebido"}</strong><p>{isPasswordRecovery ? "Use o link recebido ou informe o código de recuperação para criar uma nova senha." : "Enviamos um link de confirmação. Abra-o no mesmo navegador para concluir o cadastro; depois entre normalmente no GrafiCalc."}</p>{erro && <p className="form-message error">O link já foi usado ou expirou. Solicite um novo e-mail para continuar.</p>}</div>
    {isPasswordRecovery && <ActionForm action={verifyEmailOtpAction} buttonLabel={actionLabel} pendingLabel="Confirmando...">
      <input type="hidden" name="next" value={next} />
      <label className="field"><span>E-mail cadastrado</span><input name="email" type="email" defaultValue={email} autoComplete="email" required /></label>
      <label className="field"><span>Código de recuperação</span><input name="token" inputMode="numeric" pattern="[0-9]{6,8}" autoComplete="one-time-code" maxLength={8} required /></label>
    </ActionForm>}
    <ActionForm action={resendAction} buttonLabel={resendLabel} pendingLabel="Reenviando...">
      <label className="field"><span>{isPasswordRecovery ? "Não recebeu o código? Informe seu e-mail" : "Não recebeu o link? Informe seu e-mail"}</span><input name="email" type="email" defaultValue={email} autoComplete="email" required /></label>
      <Turnstile />
    </ActionForm>
    <p className="form-footer"><Link href={isPasswordRecovery ? "/recuperar-senha" : "/entrar"}>Voltar</Link></p>
  </AuthShell>;
}
