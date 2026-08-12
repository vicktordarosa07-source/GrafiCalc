import type { ActionState } from "@/app/auth/actions";

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.message) return null;
  return <p className={`form-message ${state.ok ? "success" : "error"}`} role="status">{state.message}</p>;
}
