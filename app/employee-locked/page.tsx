"use client";

import { FormEvent, useState } from "react";

export default function EmployeeLockedPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/team/employee-session/exit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }), cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !result.ok) {
      setMessage(result.error === "invalid-owner-password" ? "Senha do proprietário incorreta." : "Não foi possível validar o acesso. Confira se a conta proprietária continua conectada.");
      return;
    }
    window.location.assign("/workspace");
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.assign("/entrar");
  }

  return (
    <main className="employee-lock-page">
      <section className="employee-lock-card">
        <p className="employee-lock-eyebrow">GrafiCalc · acesso protegido</p>
        <h1>Sessão do colaborador encerrada</h1>
        <p className="employee-lock-copy">Para voltar às configurações e aos dados gerais da loja, o proprietário precisa confirmar a senha da conta.</p>
        <form onSubmit={unlock} className="employee-lock-form">
          <label>
            Senha do proprietário
            <input autoFocus type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
          </label>
          {message && <p role="alert" className="employee-lock-error">{message}</p>}
          <button disabled={busy} type="submit">{busy ? "Validando…" : "Desbloquear acesso geral"}</button>
        </form>
        <button type="button" onClick={signOut} className="employee-lock-signout">Sair da conta proprietária neste computador</button>
      </section>
    </main>
  );
}
