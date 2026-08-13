"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/app/auth/actions";
import { maskCpfCnpj, maskPhone } from "@/lib/validation/documents";
import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/auth/submit-button";

type Profile = { nome: string; empresa: string; cpf_cnpj: string | null; telefone: string | null; email: string };

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action] = useActionState(updateProfileAction, { ok: false, message: "" });
  return <form className="auth-form signup-grid" action={action}>
    <label className="field"><span>Nome completo</span><input name="nome" defaultValue={profile.nome} required /></label>
    <label className="field"><span>Empresa</span><input name="empresa" defaultValue={profile.empresa} required /></label>
    <label className="field"><span>CPF/CNPJ</span><input name="cpfCnpj" defaultValue={maskCpfCnpj(profile.cpf_cnpj || "")} required /></label>
    <label className="field"><span>Telefone</span><input name="telefone" defaultValue={maskPhone(profile.telefone || "")} required /></label>
    <label className="field full"><span>E-mail confirmado</span><input value={profile.email} disabled /></label>
    <div className="full"><FormMessage state={state} /></div>
    <div className="full"><SubmitButton pendingText="Salvando...">Salvar perfil</SubmitButton></div>
  </form>;
}
