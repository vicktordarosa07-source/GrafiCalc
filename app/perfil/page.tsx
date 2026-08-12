import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { InactivityGuard } from "@/components/auth/inactivity-guard";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome,empresa,cpf_cnpj,telefone,email")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/workspace");

  return (
    <main className="profile-page">
      <InactivityGuard />
      <header className="profile-header">
        <div><span>Minha conta</span><h1>Dados e segurança</h1></div>
        <nav>
          <Link className="button" href="/workspace">Voltar ao GrafiCalc</Link>
          <form action={logoutAction}><button className="button danger">Sair</button></form>
        </nav>
      </header>
      <section className="profile-card"><ProfileForm profile={profile} /></section>
      <section className="profile-card">
        <h2>Alterar senha</h2>
        <p>Enviaremos um fluxo seguro de recuperação para o seu e-mail.</p>
        <Link className="button" href="/recuperar-senha">Alterar minha senha</Link>
      </section>
    </main>
  );
}
