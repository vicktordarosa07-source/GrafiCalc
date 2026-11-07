"use client";

import { FormEvent, useEffect, useState } from "react";

type Employee = { id: string; name: string; pinConfigured: boolean };

const errors: Record<string, string> = {
  "invalid-access-pin": "PIN incorreto ou não configurado. Confira os dados e tente novamente.",
  "too-many-attempts": "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
  "invalid-owner-password": "Senha da conta proprietária incorreta.",
  "admin-pin-already-configured": "O PIN ADM foi configurado em outro acesso. Atualize esta página.",
  "rate-limit-unavailable": "A validação segura está indisponível neste momento.",
};

export function WorkspaceAccessGate() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [adminPinConfigured, setAdminPinConfigured] = useState(false);
  const [mode, setMode] = useState<"admin" | "employee">("admin");
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/team/access-mode", { cache: "no-store" })
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "employee-session-unavailable");
        if (!active) return;
        const available = Array.isArray(result.employees) ? result.employees as Employee[] : [];
        setEmployees(available);
        setEmployeeId(available.find(item => item.pinConfigured)?.id || "");
        setAdminPinConfigured(Boolean(result.adminPinConfigured));
        setReady(true);
      })
      .catch(() => { if (active) setMessage("Não foi possível carregar os acessos desta equipe. Atualize a página ou saia e entre novamente."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function enter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "admin" && !adminPinConfigured && pin !== confirmPin) {
      setMessage("Os dois campos do PIN ADM precisam ser iguais.");
      return;
    }
    setBusy(true);
    setMessage("");
    const payload = mode === "employee"
      ? { mode, employeeId, pin }
      : adminPinConfigured
        ? { mode, pin }
        : { mode: "setup-admin", password, pin, confirmPin };
    const response = await fetch("/api/team/access-mode", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), cache: "no-store",
    }).catch(() => null);
    const result = await response?.json().catch(() => ({})) || {};
    setBusy(false);
    if (!response?.ok || !result.ok) {
      setMessage(errors[result.error] || "Não foi possível validar este PIN. Tente novamente.");
      setPin("");
      return;
    }
    window.location.assign("/workspace");
  }

  async function signOut() {
    await fetch("/api/auth/signout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/entrar");
  }

  const employeeOptions = employees.filter(employee => employee.pinConfigured);

  return (
    <main className="employee-lock-page workspace-entry-page">
      <section className="employee-lock-card workspace-entry-card">
        <p className="employee-lock-eyebrow">GrafiCalc · acesso da equipe</p>
        <h1>Quem vai usar o sistema?</h1>
        <p className="employee-lock-copy">A sessão da loja permanece conectada neste computador. Entre com seu PIN para abrir o acesso ADM ou o perfil autorizado do operador.</p>

        <div className="workspace-entry-modes" role="group" aria-label="Tipo de acesso">
          <button type="button" aria-pressed={mode === "admin"} className={mode === "admin" ? "is-active" : ""} onClick={() => { setMode("admin"); setMessage(""); setPin(""); }}>ADM</button>
          <button type="button" aria-pressed={mode === "employee"} className={mode === "employee" ? "is-active" : ""} onClick={() => { setMode("employee"); setMessage(""); setPin(""); }}>Operador</button>
        </div>

        {loading ? <p className="workspace-entry-help" role="status">Carregando acessos…</p> : !ready ? <p role="alert" className="employee-lock-error">{message || "Não foi possível validar esta sessão."}</p> : (
          <form onSubmit={enter} className="employee-lock-form">
            {mode === "employee" ? <>
              <label>Operador
                <select required value={employeeId} onChange={event => setEmployeeId(event.target.value)} disabled={!employeeOptions.length}>
                  <option value="">Selecione seu nome</option>
                  {employeeOptions.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
                </select>
              </label>
              {!employeeOptions.length && <p className="workspace-entry-help">Nenhum operador com PIN ativo. O ADM precisa cadastrar o operador e definir o PIN na aba Equipe.</p>}
              <label>PIN do operador
                <input autoFocus type="password" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))} required />
              </label>
            </> : adminPinConfigured ? <label>PIN ADM
              <input autoFocus type="password" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
            </label> : <>
              <p className="workspace-entry-help">Configure o primeiro PIN ADM. Confirme a senha da conta proprietária uma vez; depois, o acesso diário será feito pelo PIN.</p>
              <label>Senha da conta proprietária
                <input autoFocus type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required />
              </label>
              <label>Novo PIN ADM (4 a 6 dígitos)
                <input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
              </label>
              <label>Confirme o PIN ADM
                <input type="password" inputMode="numeric" autoComplete="new-password" pattern="[0-9]{4,6}" minLength={4} maxLength={6} value={confirmPin} onChange={event => setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
              </label>
            </>}
            {message && <p role="alert" className="employee-lock-error">{message}</p>}
            <button type="submit" disabled={busy || loading || (mode === "employee" && !employeeOptions.length)}>{busy ? "Validando…" : mode === "admin" ? (adminPinConfigured ? "Abrir acesso ADM" : "Criar PIN e abrir sistema") : "Entrar como operador"}</button>
          </form>
        )}
        <button type="button" onClick={signOut} className="employee-lock-signout">Sair desta conta neste computador</button>
      </section>
    </main>
  );
}
