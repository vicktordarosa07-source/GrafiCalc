"use client";

import { useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

export function PasswordField({ name, label, autoComplete = "current-password", registration }: {
  name: string;
  label: string;
  autoComplete?: string;
  registration?: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="password-wrap">
        <input {...registration} name={registration?.name || name} type={visible ? "text" : "password"} autoComplete={autoComplete} required />
        <button type="button" className="eye" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? "Ocultar" : "Mostrar"}</button>
      </span>
    </label>
  );
}
