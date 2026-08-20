"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type EmailOtpType } from "@supabase/supabase-js";
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

function sanitizedOrigin(value: string | null | undefined) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string | null) {
  if (!origin) return false;
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function confirmationCallbackUrl(siteUrl: string, email: string, next = "/workspace") {
  const params = new URLSearchParams({ next, email });
  return `${siteUrl}/auth/confirm?${params.toString()}`;
}

function safeInternalRedirect(value: string | null, fallback = "/workspace") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}

function isSupportedConfirmationType(value: string): value is EmailOtpType {
  return value === "signup" || value === "recovery";
}

function isValidOtp(value: string) {
  return /^\d{6,8}$/.test(value);
}

async function authRedirectOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (host) {
    const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
    const requestOrigin = sanitizedOrigin(`${protocol}://${host}`);
    // On Vercel, the current public host is the only reliable callback target.
    // A stale NEXT_PUBLIC_SITE_URL must never send a customer back to localhost.
    if (requestOrigin && !isLocalOrigin(requestOrigin)) return requestOrigin;
  }

  const configuredOrigin = sanitizedOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (configuredOrigin && !isLocalOrigin(configuredOrigin)) return configuredOrigin;

  const vercelOrigin = sanitizedOrigin(
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  );
  if (vercelOrigin) return vercelOrigin;

  // Vercel Server Actions can expose localhost in forwarded headers when a
  // project still carries a development URL. Never let that reach customer e-mails.
  if (process.env.VERCEL === "1") return "https://grafi-calc.vercel.app";

  return "http://localhost:3210";
}

function knownSignupErrorMessage(error: { message: string }) {
  const detail = error.message.toLowerCase();
  if (/already|registered|unique|duplicate/.test(detail)) return "Já existe um cadastro com este e-mail ou documento.";
  if (/captcha|turnstile|security check/.test(detail)) return "Conclua a verificação de segurança antes de criar sua conta.";
  if (/redirect|url.*allow|not allowed/.test(detail)) return "O retorno de confirmação ainda não está autorizado no Supabase.";
  if (/database|saving new user|trigger|profile/.test(detail)) return "Não foi possível preparar o seu perfil. Tente novamente em instantes.";
  return null;
}

function passwordResetErrorMessage(error: { message: string }) {
  const detail = error.message.toLowerCase();
  if (/captcha|turnstile|security check/.test(detail)) return "Conclua a verificação de segurança antes de solicitar a recuperação.";
  if (/redirect|url.*allow|not allowed/.test(detail)) return "O retorno da recuperação ainda não está autorizado no Supabase.";
  if (/rate limit|too many|over.*limit/.test(detail)) return "Aguarde alguns minutos antes de solicitar outro e-mail.";
  return "Não foi possível solicitar o e-mail de recuperação agora. Tente novamente em instantes.";
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

async function isDocumentAlreadyRegistered(document: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("cpf_cnpj", document)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("graficalc_document_lookup_failure", { message: error.message });
      return false;
    }

    return Boolean(data);
  } catch (error) {
    // The database constraint remains the final protection if the pre-check is unavailable.
    console.error("graficalc_document_lookup_unavailable", error);
    return false;
  }
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

  const document = onlyDigits(parsed.data.cpfCnpj);
  if (await isDocumentAlreadyRegistered(document)) {
    return { ok: false, message: "Este CPF/CNPJ já está vinculado a uma conta. Entre com o e-mail cadastrado ou use outro documento." };
  }

  const supabase = await createClient();
  const siteUrl = await authRedirectOrigin();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: confirmationCallbackUrl(siteUrl, parsed.data.email),
      captchaToken: parsed.data.captchaToken || undefined,
      data: {
        nome: parsed.data.nome,
        empresa: parsed.data.empresa,
        cpf_cnpj: document,
        telefone: onlyDigits(parsed.data.telefone),
      },
    },
  });

  if (error) {
    console.error("graficalc_signup_failure", { message: error.message, status: error.status });
    const knownMessage = knownSignupErrorMessage(error);
    if (knownMessage) return { ok: false, message: knownMessage };
  }

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
  const siteUrl = await authRedirectOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: confirmationCallbackUrl(siteUrl, email, "/alterar-senha"),
    captchaToken: captchaToken || undefined,
  });
  if (error) {
    console.error("graficalc_password_reset_failure", { message: error.message, status: error.status });
    return { ok: false, message: passwordResetErrorMessage(error) };
  }
  return { ok: true, message: "Se o e-mail estiver cadastrado, enviaremos um código de recuperação." };
}

export async function resendConfirmationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim();
  const captchaToken = String(formData.get("cf-turnstile-response") || formData.get("captchaToken") || "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Informe o e-mail usado no cadastro." };
  const supabase = await createClient();
  const siteUrl = await authRedirectOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: confirmationCallbackUrl(siteUrl, email), captchaToken: captchaToken || undefined },
  });
  if (error) return { ok: false, message: "Aguarde um minuto antes de solicitar outro e-mail." };
  return { ok: true, message: "Novo e-mail de confirmação enviado." };
}

export async function confirmSupabaseLinkAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const tokenHash = String(formData.get("token_hash") || "").trim();
  const type = String(formData.get("type") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const next = safeInternalRedirect(String(formData.get("next") || ""), "/workspace");

  if ((!tokenHash || !isSupportedConfirmationType(type)) && !code) {
    return { ok: false, message: "Este link de acesso é inválido. Solicite um novo e-mail." };
  }

  const supabase = await createClient();
  const result = tokenHash && isSupportedConfirmationType(type)
    ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    : await supabase.auth.exchangeCodeForSession(code);

  if (result.error) {
    return { ok: false, message: "Este link já foi usado ou expirou. Solicite um novo e-mail." };
  }

  redirect(next);
}

export async function verifyEmailOtpAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = String(formData.get("token") || "").replace(/\s/g, "");
  const next = safeInternalRedirect(String(formData.get("next") || ""), "/workspace");
  const type: EmailOtpType = next === "/alterar-senha" ? "recovery" : "signup";

  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !isValidOtp(token)) {
    return { ok: false, message: "Informe o e-mail e o código recebido corretamente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type });
  if (error) {
    return { ok: false, message: "Código inválido ou expirado. Solicite um novo e-mail e tente novamente." };
  }

  redirect(next);
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
