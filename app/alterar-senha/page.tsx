import { updatePasswordAction } from "@/app/auth/actions";
import { ActionForm } from "@/components/auth/action-form";
import { PasswordField } from "@/components/auth/password-field";
import { AuthShell } from "@/components/layout/auth-shell";

export default function ChangePasswordPage() {
  return <AuthShell eyebrow="Segurança" title="Crie uma nova senha" description="A nova senha deve seguir todos os requisitos de segurança.">
    <ActionForm action={updatePasswordAction} buttonLabel="Salvar nova senha" pendingLabel="Salvando...">
      <PasswordField name="password" label="Nova senha" autoComplete="new-password" />
      <PasswordField name="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" />
      <p className="password-rule">Use 8 ou mais caracteres, incluindo maiúscula, minúscula, número e símbolo.</p>
    </ActionForm>
  </AuthShell>;
}
