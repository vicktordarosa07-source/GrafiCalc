async function prepareLegacySession() {
  if (window.location.protocol === "file:") return;
  const response = await fetch("/api/auth/legacy-session", { cache: "no-store" });
  if (!response.ok) {
    window.top.location.replace("/entrar");
    throw new Error("Sessao Supabase invalida");
  }
  const user = await response.json();
  const legacyUser = {
    id: user.id, username: user.nome || user.email, email: user.email,
    document: user.cpf_cnpj || "", company: user.empresa || "",
    role: user.papel === "funcionario" ? "employee" : "user", developerAccess: false,
    status: "active", groupId: user.papel === "funcionario" ? "funcionarios" : "profissional",
    teamLeader: user.teamLeader === true, createdAt: user.criado_em,
    emailVerification: { status: "verified" },
  };
  window.grafiCalcRemoteAuth = {
    userId: user.id, tenantId: user.tenant_id, teamLeader: user.teamLeader === true,
    configPermissions: user.configPermissions, user: legacyUser, members: user.members || [],
  };
  const identity = JSON.stringify([user.id, user.tenant_id]);
  const identityKey = "graficalc-active-workspace-v2";
  localStorage.setItem(identityKey, identity);
  localStorage.removeItem("graficalc-developer-persistent-login-v1");
  sessionStorage.removeItem("graficalc-config-unlocked-v1");
  let invalidated = false;
  function invalidateSession() {
    if (invalidated) return;
    invalidated = true;
    document.body.replaceChildren();
    window.top.location.replace("/entrar");
  }
  window.addEventListener("storage", (event) => {
    if ((event.key === identityKey || event.key === null) && localStorage.getItem(identityKey) !== identity) invalidateSession();
  });
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : input, window.location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return originalFetch(input, init);
    if (invalidated || localStorage.getItem(identityKey) !== identity) {
      invalidateSession();
      throw new Error("workspace-session-changed");
    }
    const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
    headers.set("X-GrafiCalc-User", user.id);
    headers.set("X-GrafiCalc-Tenant", user.tenant_id);
    const result = await originalFetch(input, { ...init, headers, cache: "no-store" });
    if (result.status === 401) invalidateSession();
    if (result.status === 409) {
      const body = await result.clone().json().catch(() => ({}));
      if (body.error === "workspace-session-changed") invalidateSession();
    }
    return result;
  };
}
window.grafiCalcLegacyAuthReady = prepareLegacySession();

const secureAuthStyle = document.createElement("style");
secureAuthStyle.textContent = "#account-password-form,#developer-password-form,#password-change-modal{display:none!important}";
document.head.appendChild(secureAuthStyle);

document.addEventListener("click", async (event) => {
  if (event.target.closest('[data-tab-target="conta"]')) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.top.location.assign("/perfil");
    return;
  }
  if (!event.target.closest("#logout-button, #menu-logout-button")) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const response = await fetch("/api/auth/signout", { method: "POST" });
  if (response.ok) {
    localStorage.removeItem("graficalc-active-workspace-v2");
    window.top.location.replace("/entrar");
  }
}, true);
