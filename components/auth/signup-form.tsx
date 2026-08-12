"use client";

import { startTransition, useActionState, useRef } from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signupAction } from "@/app/auth/actions";
import { maskCpfCnpj, maskPhone } from "@/lib/validation/documents";
import { FormMessage } from "./form-message";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";
import { Turnstile } from "./turnstile";

type SignupValues = { nome: string; empresa: string; cpfCnpj: string; telefone: string; email: string; password: string; confirmPassword: string };

export function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action] = useActionState(signupAction, { ok: false, message: "" });
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<SignupValues>();
  const submit = handleSubmit(() => startTransition(() => action(new FormData(formRef.current!))));
  const errorFor = (name: keyof SignupValues) => errors[name]?.message || state.fieldErrors?.[name]?.[0];

  return (
    <form ref={formRef} className="auth-form signup-grid" onSubmit={submit} noValidate>
      <label className="field"><span>Nome completo</span><input autoComplete="name" {...register("nome", { required: "Informe seu nome." })} /></label>
      <label className="field"><span>Empresa / gráfica</span><input autoComplete="organization" {...register("empresa", { required: "Informe sua empresa." })} /></label>
      <label className="field"><span>CPF ou CNPJ</span><input inputMode="numeric" {...register("cpfCnpj", { required: "Informe o documento.", onChange: (event) => setValue("cpfCnpj", maskCpfCnpj(event.target.value)) })} /></label>
      <label className="field"><span>Telefone</span><input inputMode="tel" autoComplete="tel" {...register("telefone", { required: "Informe o telefone.", onChange: (event) => setValue("telefone", maskPhone(event.target.value)) })} /></label>
      <label className="field full"><span>E-mail</span><input type="email" autoComplete="email" {...register("email", { required: "Informe seu e-mail." })} /></label>
      <PasswordField name="password" label="Senha" autoComplete="new-password" registration={register("password", { required: "Crie uma senha." })} />
      <PasswordField name="confirmPassword" label="Confirmar senha" autoComplete="new-password" registration={register("confirmPassword", { required: "Repita a senha." })} />
      {Object.keys(errors).length > 0 && <p className="field-error full">{errorFor(Object.keys(errors)[0] as keyof SignupValues)}</p>}
      <p className="password-rule full">Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial.</p>
      <div className="full"><Turnstile /></div>
      <div className="full"><FormMessage state={state} /></div>
      <div className="full"><SubmitButton pendingText="Criando cadastro...">Criar minha conta</SubmitButton></div>
      <p className="form-footer full">Já possui cadastro? <Link href="/entrar">Entrar</Link></p>
    </form>
  );
}
