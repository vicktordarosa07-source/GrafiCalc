async function prepareLegacySession() {
  if (window.location.protocol === "file:") {
    return;
  }

  const response = await fetch("/api/auth/legacy-session", { cache: "no-store" });
  if (!response.ok) {
    window.top.location.replace("/entrar");
    throw new Error("Sessao Supabase invalida");
  }

  const user = await response.json();
  const now = new Date().toISOString();
  const developerEmail = "hprvisual@hotmail.com";
  // A sessao Supabase e a fonte de identidade em producao. Nao deixe um
  // login legado persistente do desenvolvedor substituir a conta atual.
  localStorage.removeItem("graficalc-developer-persistent-login-v1");
  sessionStorage.removeItem("graficalc-config-unlocked-v1");
  window.grafiCalcRemoteAuth = { userId: user.id, tenantId: user.tenant_id || "", teamLeader: user.teamLeader === true };
  const legacyUser = {
    id: user.id,
    username: user.nome || user.email,
    email: user.email,
    document: user.cpf_cnpj || "",
    company: user.empresa || "",
    role: user.papel === "funcionario" ? "employee" : "user",
    status: "active",
    groupId: user.papel === "funcionario" ? "funcionarios" : "profissional",
    teamLeader: user.teamLeader === true,
    emailVerification: { status: "verified", code: "", verifiedAt: now, sentAt: "", expiresAt: "", resendAvailableAt: "", lastDeliveryMode: "supabase" },
    documentVerification: { status: "local-valid", source: "local", checkedAt: now, verifiedAt: now, message: "Documento validado no cadastro." },
    createdAt: user.criado_em || now,
    updatedAt: now,
  };

  let existingUsers = [];
  try {
    const storedUsers = JSON.parse(localStorage.getItem("graficalc-auth-users-v1") || "[]");
    existingUsers = Array.isArray(storedUsers) ? storedUsers : [];
  } catch {
    existingUsers = [];
  }
  const currentEmail = String(legacyUser.email || "").trim().toLowerCase();
  const mergedUsers = existingUsers.filter((item) => (
    String(item?.id || "") !== String(legacyUser.id || "")
    && String(item?.email || "").trim().toLowerCase() !== currentEmail
  ));
  if (currentEmail !== developerEmail) {
    mergedUsers.push(legacyUser);
  }
  localStorage.setItem("graficalc-auth-users-v1", JSON.stringify(mergedUsers));
  localStorage.setItem("graficalc-auth-session-v1", JSON.stringify({
    userId: user.id,
    username: currentEmail === developerEmail ? "Helder Pedro da Rosa" : legacyUser.username,
    role: currentEmail === developerEmail ? "developer" : legacyUser.role,
    loggedAt: now,
  }));

}

window.grafiCalcLegacyAuthReady = prepareLegacySession();

const secureAuthStyle = document.createElement("style");
secureAuthStyle.textContent = "#account-password-form,#developer-password-form,#password-change-modal{display:none!important}";
document.head.appendChild(secureAuthStyle);

document.addEventListener("click", async (event) => {
  const accountButton = event.target.closest('[data-tab-target="conta"]');
  if (accountButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.top.location.assign("/perfil");
    return;
  }

  const button = event.target.closest("#logout-button, #menu-logout-button");
  if (!button) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  await fetch("/api/auth/signout", { method: "POST" });
  window.top.location.replace("/entrar");
}, true);
