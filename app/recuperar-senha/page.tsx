import Link from "next/link";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { Turnstile } from "@/components/auth/turnstile";
import { AuthShell } from "@/components/layout/auth-shell";

export default function RecoverPage() {
  return <AuthShell eyebrow="Recuperação" title="Recuperar senha" description="Enviaremos um link seguro para o e-mail cadastrado.">
    <ActionForm action={requestPasswordResetAction} buttonLabel="Enviar link" pendingLabel="Enviando...">
      <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required /></label>
      <Turnstile />
      <p className="form-footer"><Link href="/entrar">Voltar ao login</Link></p>
    </ActionForm>
  </AuthShell>;
}
