"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, passwordSchema, profileSchema } from "@/lib/validation/auth";
import { onlyDigits } from "@/lib/validation/documents";

export type ActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string[]> };

function fields(formData: FormData) {
  const values = Object.fromEntries(formData.entries());
  return {
    ...values,
    captchaToken: values.captchaToken || values["cf-turnstile-response"],
  };
}

async function requestIdentity() {
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return ip;
}

async function authRateLimitKey(identifier: string) {
  const ip = await requestIdentity();
  return `${ip}:${identifier.toLowerCase()}`;
}

async function isLoginAllowed(identifier: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("graficalc_auth_attempt_allowed", {
    p_key: await authRateLimitKey(identifier),
  });
  if (error) throw new Error("Não foi possível validar o limite de acesso.");
  return Boolean(data);
}

async function recordLoginFailure(identifier: string) {
  const admin = createAdminClient();
  await admin.rpc("graficalc_record_auth_failure", { p_key: await authRateLimitKey(identifier) });
}

async function clearLoginFailures(identifier: string) {
  const admin = createAdminClient();
  await admin.rpc("graficalc_clear_auth_failures", { p_key: await authRateLimitKey(identifier) });
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) return { ok: false, message: "Revise os campos informados.", fieldErrors: parsed.error.flatten().fieldErrors };

  if (!(await isLoginAllowed(parsed.data.email))) {
    return { ok: false, message: "Muitas tentativas. Aguarde 15 minutos e tente novamente." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: parsed.data.captchaToken ? { captchaToken: parsed.data.captchaToken } : undefined,
  });

  if (error || !data.user) {
    await recordLoginFailure(parsed.data.email);
    return { ok: false, message: "E-mail ou senha inválidos." };
  }
  if (!data.user.email_confirmed_at) {
    await recordLoginFailure(parsed.data.email);
    await supabase.auth.signOut();
    return { ok: false, message: "Confirme seu e-mail antes de entrar." };
  }

  await clearLoginFailures(parsed.data.email);

  redirect("/workspace");
}

export async function signupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(fields(formData));
  if (!parsed.success) return { ok: false, message: "Revise os campos do cadastro.", fieldErrors: parsed.error.flatten().fieldErrors };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3210";
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/workspace`,
      captchaToken: parsed.data.captchaToken || undefined,
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa,
        cpf_cnpj: onlyDigits(parsed.data.cpfCnpj),
        telefone: onlyDigits(parsed.data.telefone),
      },
    },
  });

  if (error) {
    const duplicate = /already|registered|unique/i.test(error.message);
    return { ok: false, message: duplicate ? "Já existe um cadastro com esses dados." : "Não foi possível concluir o cadastro." };
  }

  redirect(`/confirmar-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function requestPasswordResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const captchaToken = String(formData.get("cf-turnstile-response") || formData.get("captchaToken") || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Informe um e-mail válido." };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3210";
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/alterar-senha`,
    captchaToken: captchaToken || undefined,
  });
  return { ok: true, message: "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação." };
}

export async function resendConfirmationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const captchaToken = String(formData.get("cf-turnstile-response") || formData.get("captchaToken") || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Informe o e-mail usado no cadastro." };
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3210";
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/confirm?next=/workspace`, captchaToken: captchaToken || undefined },
  });
  if (error) return { ok: false, message: "Aguarde um minuto antes de solicitar outro e-mail." };
  return { ok: true, message: "Novo e-mail de confirmação enviado." };
}

export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get("password") || "");
  const confirmation = String(formData.get("confirmPassword") || "");
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Senha inválida." };
  if (password !== confirmation) return { ok: false, message: "As senhas não coincidem." };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, message: "Não foi possível alterar a senha." };
  return { ok: true, message: "Senha alterada com sucesso." };
}

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = profileSchema.safeParse(fields(formData));
  if (!parsed.success) return { ok: false, message: "Revise os dados informados.", fieldErrors: parsed.error.flatten().fieldErrors };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sua sessão expirou. Entre novamente." };
  const { error } = await supabase.from("profiles").update({
    nome: parsed.data.nome,
    empresa: parsed.data.empresa,
    cpf_cnpj: onlyDigits(parsed.data.cpfCnpj),
    telefone: onlyDigits(parsed.data.telefone),
    atualizado_em: new Date().toISOString(),
  }).eq("id", user.id);
  if (error) return { ok: false, message: "Não foi possível salvar o perfil." };
  return { ok: true, message: "Perfil atualizado com sucesso." };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/entrar");
}
