import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEVELOPER_COOKIE, DEVELOPER_EMAIL, isDeveloperEligible, readDeveloperSession } from "@/lib/developer-session";
import { cookies } from "next/headers";

type DirectoryProfile = {
  id: string;
  nome?: string | null;
  empresa?: string | null;
  cpf_cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  email_confirmado?: boolean | null;
  papel?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
};

function safeUser(profile: DirectoryProfile | undefined, authUser: { id: string; email?: string | null; email_confirmed_at?: string | null; created_at?: string | null }) {
  const email = String(profile?.email || authUser.email || "").trim().toLowerCase();
  const confirmed = Boolean(authUser.email_confirmed_at || profile?.email_confirmado);
  const role = String(profile?.papel || "usuario").trim().toLowerCase() === "funcionario" ? "employee" : "user";
  const username = String(profile?.nome || email.split("@")[0] || "Usuário").trim();
  return {
    id: authUser.id,
    username,
    email,
    document: String(profile?.cpf_cnpj || "").trim(),
    company: String(profile?.empresa || "").trim(),
    role,
    developerAccess: false,
    status: confirmed ? "active" : "pending",
    groupId: role === "employee" ? "funcionarios" : "profissional",
    emailVerification: {
      status: confirmed ? "verified" : "pending",
      email,
      verifiedAt: authUser.email_confirmed_at || "",
    },
    documentVerification: { status: "not-checked", source: "local" },
    createdAt: profile?.criado_em || authUser.created_at || new Date().toISOString(),
    updatedAt: profile?.atualizado_em || profile?.criado_em || authUser.created_at || new Date().toISOString(),
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at || !isDeveloperEligible(user)) {
    return Response.json({ error: "developer-session-required" }, { status: 403 });
  }

  const token = (await cookies()).get(DEVELOPER_COOKIE)?.value;
  const developerSession = readDeveloperSession(token);
  if (!developerSession || developerSession.userId !== user.id) {
    return Response.json({ error: "developer-session-required" }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const [{ data: profiles, error: profilesError }, authUsers] = await Promise.all([
      admin
        .from("profiles")
        .select("id,nome,empresa,cpf_cnpj,telefone,email,email_confirmado,papel,criado_em,atualizado_em"),
      (async () => {
        const users: Array<{ id: string; email?: string | null; email_confirmed_at?: string | null; created_at?: string | null }> = [];
        for (let page = 1; page <= 20; page += 1) {
          const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
          if (result.error) throw result.error;
          users.push(...result.data.users);
          if (result.data.users.length < 1000) break;
        }
        return users;
      })(),
    ]);
    if (profilesError) throw profilesError;

    const profileById = new Map((profiles || []).map((profile) => [profile.id, profile as DirectoryProfile]));
    const users = authUsers
      .filter((authUser) => String(authUser.email || "").trim().toLowerCase() !== DEVELOPER_EMAIL)
      .map((authUser) => safeUser(profileById.get(authUser.id), authUser));

    return Response.json({ ok: true, users }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "user-directory-read-failed" }, { status: 500 });
  }
}
