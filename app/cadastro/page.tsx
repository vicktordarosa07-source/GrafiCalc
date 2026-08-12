import { SignupForm } from "@/components/auth/signup-form";
import { AuthShell } from "@/components/layout/auth-shell";

export default function SignupPage() {
  return <AuthShell eyebrow="Nova conta" title="Cadastre sua gráfica" description="Seus dados ficam vinculados à conta e sua senha é protegida exclusivamente pelo Supabase Auth."><SignupForm /></AuthShell>;
}
