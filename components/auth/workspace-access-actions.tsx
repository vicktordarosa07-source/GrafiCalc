"use client";

import { FormEvent, useState } from "react";

type Employee = { id: string; name: string; pinConfigured: boolean };

const errorText: Record<string, string> = {
  "invalid-access-pin": "PIN inválido. O acesso atual continua ativo.",
  "too-many-attempts": "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
};

export function WorkspaceAccessActions({ employeeMode, operatorName }: { employeeMode: boolean; operatorName?: string }) {
  const [open, setOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selected, setSelected] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function openSwitcher() {
    setError("");
    setPin("");
    setBusy(true);
    const response = await fetch("/api/team/access-mode", { cache: "no-store" }).catch(() => null);
    const result = await response?.json().catch(() => ({})) || {};
    setBusy(false);
    if (!response?.ok) {
      setError("Não foi possível carregar a lista de operadores.");
      setOpen(true);
      return;
    }
    const available = (Array.isArray(result.employees) ? result.employees : [])
      .filter((employee: Employee) => employee.pinConfigured);
    setEmployees(available);
    setSelected("");
    setOpen(true);
  }

  async function switchAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const mode = selected === "admin" ? "admin" : "employee";
    if (mode === "admin" ? !/^\d{4,6}$/.test(pin) : !/^\d{4}$/.test(pin)) {
      setError(mode === "admin" ? "Informe o PIN ADM com 4 a 6 dígitos." : "Informe o PIN do operador com 4 dígitos.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch("/api/team/access-mode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mode === "admin" ? { mode, pin } : { mode, employeeId: selected, pin }),
      cache: "no-store",
    }).catch(() => null);
    const result = await response?.json().catch(() => ({})) || {};
    setBusy(false);
    if (!response?.ok || !result.ok) {
      setError(errorText[result.error] || "Não foi possível trocar o acesso.");
      setPin("");
      return;
    }
    window.location.assign("/workspace");
  }

  async function logoutOperator() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/team/access-mode", { method: "DELETE", cache: "no-store" }).catch(() => null);
    if (!response?.ok) {
      setBusy(false);
      setError("Não foi possível encerrar o acesso do operador.");
      return;
    }
    window.location.assign("/workspace");
  }

  const adminSelected = selected === "admin";

  return <>
    <div className="workspace-access-actions">
      {employeeMode && <span className="workspace-current-operator">{operatorName ? `Operador: ${operatorName}` : "Modo operador"}</span>}
      <button type="button" className="workspace-action-button workspace-action-primary" onClick={openSwitcher} disabled={busy}>
        {employeeMode ? "Trocar de operador" : "Acesso do operador"}
      </button>
      {employeeMode && <button type="button" className="workspace-action-button workspace-action-logout" onClick={logoutOperator} disabled={busy}>
        Logout operador
      </button>}
    </div>
    {error && !open && <span className="workspace-access-toast" role="alert">{error}</span>}
    {open && <div className="workspace-switch-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section className="workspace-switch-dialog" role="dialog" aria-modal="true" aria-labelledby="workspace-switch-title">
        <p className="workspace-switch-eyebrow">Ponto de acesso da loja</p>
        <h2 id="workspace-switch-title">Trocar de operador</h2>
        <p>Escolha ADM ou operador e confirme o PIN. A sessão central continua conectada.</p>
        <form onSubmit={switchAccess}>
          <label htmlFor="workspace-switch-user">Acesso</label>
          <select id="workspace-switch-user" required value={selected} onChange={event => { setSelected(event.target.value); setPin(""); setError(""); }}>
            <option value="">Selecione ADM ou operador</option>
            <option value="admin">ADM da conta</option>
            {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
          </select>
          <label htmlFor="workspace-switch-pin">PIN {adminSelected ? "ADM (4 a 6 dígitos)" : "do operador (4 dígitos)"}</label>
          <input id="workspace-switch-pin" type="password" inputMode="numeric" autoComplete="one-time-code"
            pattern={adminSelected ? "[0-9]{4,6}" : "[0-9]{4}"} maxLength={adminSelected ? 6 : 4} required value={pin}
            onChange={event => setPin(event.target.value.replace(/\D/g, "").slice(0, adminSelected ? 6 : 4))} />
          {error && <p className="workspace-switch-error" role="alert">{error}</p>}
          <div className="workspace-switch-buttons">
            <button type="button" className="workspace-action-button" onClick={() => setOpen(false)} disabled={busy}>Cancelar</button>
            <button type="submit" className="workspace-action-button workspace-action-primary" disabled={busy || !selected}>
              {busy ? "Validando…" : "Confirmar troca"}
            </button>
          </div>
        </form>
      </section>
    </div>}
  </>;
}
