import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthShell eyebrow="Acesso seguro" title="Entrar no GrafiCalc" description="Use seu e-mail e senha para abrir sua área de trabalho."><LoginForm /></AuthShell>;
}
