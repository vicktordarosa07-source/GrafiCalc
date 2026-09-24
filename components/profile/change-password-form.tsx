"use client";

import { useActionState } from "react";
import { changePasswordAction, type ActionState } from "@/app/auth/actions";
import { FormMessage } from "@/components/auth/form-message";
import { PasswordField } from "@/components/auth/password-field";
import { SubmitButton } from "@/components/auth/submit-button";

export function ChangePasswordForm() {
  const [state, action] = useActionState<ActionState, FormData>(changePasswordAction, { ok: false, message: "" });
  return <form className="auth-form password-change-account-form" action={action}>
    <PasswordField name="currentPassword" label="Senha atual" autoComplete="current-password" />
    <PasswordField name="password" label="Nova senha" autoComplete="new-password" />
    <PasswordField name="confirmPassword" label="Confirmar nova senha" autoComplete="new-password" />
    <p className="password-rule full">Use 8 ou mais caracteres, com letra maiúscula, minúscula, número e caractere especial.</p>
    <FormMessage state={state} />
    <SubmitButton pendingText="Alterando...">Alterar senha</SubmitButton>
  </form>;
}
