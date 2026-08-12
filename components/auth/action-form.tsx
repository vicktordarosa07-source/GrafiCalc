"use client";

import { useActionState } from "react";
import type { ActionState } from "@/app/auth/actions";
import { FormMessage } from "./form-message";
import { SubmitButton } from "./submit-button";

export function ActionForm({ action, children, buttonLabel, pendingLabel }: {
  action: (state: ActionState, data: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  buttonLabel: string;
  pendingLabel?: string;
}) {
  const [state, formAction] = useActionState(action, { ok: false, message: "" });
  return <form className="auth-form" action={formAction}>{children}<FormMessage state={state} /><SubmitButton pendingText={pendingLabel}>{buttonLabel}</SubmitButton></form>;
}
