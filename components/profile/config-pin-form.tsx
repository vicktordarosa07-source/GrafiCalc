"use client";

import { useEffect, useState, type FormEvent } from "react";

type PinPermissions = { managePin: boolean };

export function ConfigPinForm() {
  const [permissions, setPermissions] = useState<PinPermissions | null>(null);
  const [pinConfigured, setPinConfigured] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error" | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/config/pin/context", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!result?.ok) return;
        setPermissions(result.permissions || { managePin: false });
        setPinConfigured(Boolean(result.pinConfigured));
      })
      .catch(() => setPermissions({ managePin: false }));
  }, []);

  if (!permissions?.managePin) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!/^\d{4,6}$/.test(newPin) || newPin !== confirmPin) {
      setTone("error");
      setMessage("O novo PIN deve ter de 4 a 6 dígitos e ser confirmado corretamente.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/config/pin/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin, confirmPin }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "pin-change-failed");
      }
      setPinConfigured(true);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setTone("success");
      setMessage("PIN de segurança salvo. Ele será solicitado ao salvar configurações.");
    } catch (error) {
      setTone("error");
      setMessage(error instanceof Error && error.message === "invalid-current-pin" ? "PIN atual incorreto." : "Não foi possível salvar o PIN agora.");
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/config/pin/recover", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error("recovery-failed");
      setTone("success");
      setMessage("Enviamos um PIN temporário para o e-mail da sua conta. Ele expira em 10 minutos.");
    } catch {
      setTone("error");
      setMessage("Não foi possível enviar o PIN temporário. Verifique a configuração de e-mail.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="profile-card">
    <h2>PIN de segurança das configurações</h2>
    <p>{pinConfigured ? "Altere o PIN usado para salvar alterações na aba Configuração." : "Crie o primeiro PIN. Deixe o campo de PIN atual vazio."}</p>
    <form className="auth-form" onSubmit={submit}>
      <label className="field"><span>PIN atual</span><input value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} type="password" autoComplete="current-password" /></label>
      <label className="field"><span>Novo PIN</span><input required value={newPin} onChange={(event) => setNewPin(event.target.value)} inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} type="password" autoComplete="new-password" /></label>
      <label className="field"><span>Confirmar novo PIN</span><input required value={confirmPin} onChange={(event) => setConfirmPin(event.target.value)} inputMode="numeric" pattern="[0-9]{4,6}" maxLength={6} type="password" autoComplete="new-password" /></label>
      {message && <p className={`form-message ${tone}`}>{message}</p>}
      <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Processando..." : "Salvar PIN"}</button>
      <button className="button" type="button" onClick={recover} disabled={busy}>Esqueci meu PIN</button>
    </form>
  </section>;
}
