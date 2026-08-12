"use client";

import { startTransition, useActionState, useRef } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { FormMessage } from "./form-message";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";
import { Turnstile } from "./turnstile";

type LoginValues = { email: string; password: string };

export function LoginForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(loginAction, { ok: false, message: "" });
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>();
  const submit = handleSubmit(() => startTransition(() => action(new FormData(formRef.current!))));

  return (
    <form ref={formRef} className="auth-form" onSubmit={submit} noValidate>
      <label className="field"><span>E-mail</span><input type="email" autoComplete="email" {...register("email", { required: "Informe seu e-mail." })} /></label>
      {errors.email && <small className="field-error">{errors.email.message}</small>}
      <PasswordField name="password" label="Senha" />
      <Turnstile />
      <FormMessage state={state} />
      <SubmitButton pendingText="Entrando...">Entrar</SubmitButton>
      <div className="form-links"><Link href="/recuperar-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar cadastro</Link></div>
    </form>
  );
}
