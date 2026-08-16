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
  const legacyUser = {
    id: user.id,
    username: user.nome || user.email,
    email: user.email,
    document: user.cpf_cnpj || "",
    company: user.empresa || "",
    role: user.papel === "admin" ? "developer" : user.papel === "funcionario" ? "employee" : "user",
    status: "active",
    groupId: user.papel === "admin" ? "developer" : user.papel === "funcionario" ? "funcionarios" : "profissional",
    emailVerification: { status: "verified", code: "", verifiedAt: now, sentAt: "", expiresAt: "", resendAvailableAt: "", lastDeliveryMode: "supabase" },
    documentVerification: { status: "local-valid", source: "local", checkedAt: now, verifiedAt: now, message: "Documento validado no cadastro." },
    createdAt: user.criado_em || now,
    updatedAt: now,
  };

  localStorage.setItem("graficalc-auth-users-v1", JSON.stringify([legacyUser]));
  localStorage.setItem("graficalc-auth-session-v1", JSON.stringify({
    userId: user.id,
    username: legacyUser.username,
    role: legacyUser.role,
    loggedAt: now,
  }));

  if (legacyUser.role === "developer") {
    sessionStorage.setItem("graficalc-config-unlocked-v1", "true");
  }
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
