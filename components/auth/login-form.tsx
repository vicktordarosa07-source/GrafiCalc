"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { FormMessage } from "./form-message";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";
import { Turnstile } from "./turnstile";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, { ok: false, message: "" });

  return (
    <form className="auth-form" action={action} noValidate>
      <label className="field"><span>E-mail</span><input type="email" name="email" autoComplete="email" required /></label>
      <PasswordField name="password" label="Senha" />
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
      <div className="form-links"><Link href="/recuperar-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar cadastro</Link></div>
    </form>
  );
}
