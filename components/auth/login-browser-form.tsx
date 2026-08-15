"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginBrowserForm({ message }: { message?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function clearPreviousError() {
    if (searchParams.has("erro")) router.replace("/entrar", { scroll: false });
  }

  return (
    <form className="auth-form" action="/api/auth/login" method="post" onInput={clearPreviousError}>
      <label className="field"><span>E-mail</span><input type="email" name="email" autoComplete="email" required /></label>
      <label className="field"><span>Senha</span><input type="password" name="password" autoComplete="current-password" required /></label>
      {message && <p className="form-message error" role="alert">{message}</p>}
      <button className="button button-primary" type="submit">Entrar</button>
      <div className="form-links"><Link href="/recuperar-senha">Esqueci minha senha</Link><Link href="/cadastro">Criar cadastro</Link></div>
    </form>
  );
}
