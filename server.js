const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3210);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, "work");
const SHARED_STATE_FILE = path.join(DATA_DIR, "shared-state.local.json");
const EMAIL_OUTBOX_FILE = path.join(DATA_DIR, "email-outbox.local.json");
const EMAIL_PROVIDER_MODE = String(process.env.GRAFICALC_EMAIL_MODE || "local-outbox").trim().toLowerCase();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "").trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const GRAFICALC_TENANT_SLUG = String(process.env.GRAFICALC_TENANT_SLUG || "default").trim().toLowerCase();
const DEVELOPER_USERNAME = String(process.env.GRAFICALC_DEVELOPER_USERNAME || "").trim();
const DEVELOPER_PASSWORD = String(process.env.GRAFICALC_DEVELOPER_PASSWORD || "").trim();
const CONFIG_ACCESS_PASSWORD = String(process.env.GRAFICALC_CONFIG_PASSWORD || "").trim();
const SHARED_BACKEND_MODE = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local-file";
const SESSION_COOKIE_NAME = "graficalc_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SECURITY_SESSIONS = new Map();

function getEmailRuntimeStatus() {
  return {
    mode: EMAIL_PROVIDER_MODE,
    resendConfigured: Boolean(RESEND_API_KEY && RESEND_FROM_EMAIL),
    resendFromEmail: RESEND_FROM_EMAIL || "",
    localOutboxFile: EMAIL_OUTBOX_FILE,
  };
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
};

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of SECURITY_SESSIONS.entries()) {
    const expiresAt = Number(session?.expiresAt || 0);
    if (!expiresAt || expiresAt <= now) {
      SECURITY_SESSIONS.delete(token);
    }
  }
}

function parseCookies(headerValue) {
  return String(headerValue || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex <= 0) {
        return acc;
      }
      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

function buildCookieHeader(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (Number.isFinite(maxAgeSeconds)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  return parts.join("; ");
}

function appendSetCookie(response, cookieValue) {
  const existing = response.getHeader("Set-Cookie");
  if (!existing) {
    response.setHeader("Set-Cookie", cookieValue);
    return;
  }
  if (Array.isArray(existing)) {
    response.setHeader("Set-Cookie", [...existing, cookieValue]);
    return;
  }
  response.setHeader("Set-Cookie", [existing, cookieValue]);
}

function createSecuritySession(data = {}) {
  cleanupExpiredSessions();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session = {
    role: data.role || "developer",
    username: data.username || "",
    configUnlocked: Boolean(data.configUnlocked),
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  SECURITY_SESSIONS.set(token, session);
  return { token, session };
}

function getSecuritySession(request) {
  cleanupExpiredSessions();
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }
  const session = SECURITY_SESSIONS.get(token);
  if (!session) {
    return null;
  }
  if (Number(session.expiresAt || 0) <= Date.now()) {
    SECURITY_SESSIONS.delete(token);
    return null;
  }
  return { token, session };
}

function clearSecuritySession(response, token) {
  if (token) {
    SECURITY_SESSIONS.delete(token);
  }
  appendSetCookie(response, buildCookieHeader(SESSION_COOKIE_NAME, "", 0));
}

function applySecuritySessionCookie(response, token) {
  appendSetCookie(response, buildCookieHeader(SESSION_COOKIE_NAME, token, SESSION_TTL_MS / 1000));
}

function getDeveloperRuntimeStatus() {
  return {
    configured: Boolean(DEVELOPER_USERNAME && DEVELOPER_PASSWORD),
    username: DEVELOPER_USERNAME || "",
    configPasswordConfigured: Boolean(CONFIG_ACCESS_PASSWORD),
  };
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SHARED_STATE_FILE)) {
    fs.writeFileSync(
      SHARED_STATE_FILE,
      JSON.stringify({
        exists: false,
        updatedAt: "",
        payload: null,
      }, null, 2),
      "utf8"
    );
  }
  if (!fs.existsSync(EMAIL_OUTBOX_FILE)) {
    fs.writeFileSync(
      EMAIL_OUTBOX_FILE,
      JSON.stringify({
        sent: [],
      }, null, 2),
      "utf8"
    );
  }
}

function readSharedState() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(SHARED_STATE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      exists: Boolean(parsed.exists && parsed.payload),
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
      payload: parsed.payload && typeof parsed.payload === "object" ? parsed.payload : null,
    };
  } catch {
    return {
      exists: false,
      updatedAt: "",
      payload: null,
    };
  }
}

function writeSharedState(payload) {
  ensureDataFile();
  const nextState = {
    exists: Boolean(payload && typeof payload === "object"),
    updatedAt: new Date().toISOString(),
    payload: payload && typeof payload === "object" ? payload : null,
  };
  fs.writeFileSync(SHARED_STATE_FILE, JSON.stringify(nextState, null, 2), "utf8");
  return nextState;
}

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `supabase-http-${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function ensureSupabaseTenant() {
  const query = `/rest/v1/graficalc_tenants?slug=eq.${encodeURIComponent(GRAFICALC_TENANT_SLUG)}&select=id,slug,name&limit=1`;
  const existing = await supabaseRequest(query, { method: "GET" });
  if (Array.isArray(existing) && existing[0]?.id) {
    return existing[0];
  }

  const created = await supabaseRequest("/rest/v1/graficalc_tenants", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify([{
      slug: GRAFICALC_TENANT_SLUG,
      name: "GrafiCalc Workspace",
    }]),
  });

  if (!Array.isArray(created) || !created[0]?.id) {
    throw new Error("supabase-tenant-create-failed");
  }

  return created[0];
}

async function readSharedStateSupabase() {
  const tenant = await ensureSupabaseTenant();
  const query = `/rest/v1/graficalc_runtime_state?tenant_id=eq.${encodeURIComponent(tenant.id)}&select=payload,updated_at&limit=1`;
  const rows = await supabaseRequest(query, { method: "GET" });
  const row = Array.isArray(rows) ? rows[0] : null;
  return {
    exists: Boolean(row?.payload && typeof row.payload === "object"),
    updatedAt: typeof row?.updated_at === "string" ? row.updated_at : "",
    payload: row?.payload && typeof row.payload === "object" ? row.payload : null,
  };
}

async function writeSharedStateSupabase(payload) {
  const tenant = await ensureSupabaseTenant();
  const body = {
    tenant_id: tenant.id,
    payload: payload && typeof payload === "object" ? payload : null,
  };
  const rows = await supabaseRequest("/rest/v1/graficalc_runtime_state", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(body),
  });
  const row = Array.isArray(rows) ? rows[0] : rows;
  return {
    exists: Boolean(row?.payload && typeof row.payload === "object"),
    updatedAt: typeof row?.updated_at === "string" ? row.updated_at : new Date().toISOString(),
    payload: row?.payload && typeof row.payload === "object" ? row.payload : null,
  };
}

async function readSharedStateBackend() {
  if (SHARED_BACKEND_MODE === "supabase") {
    return readSharedStateSupabase();
  }
  return readSharedState();
}

async function writeSharedStateBackend(payload) {
  if (SHARED_BACKEND_MODE === "supabase") {
    return writeSharedStateSupabase(payload);
  }
  return writeSharedState(payload);
}

function normalizeServerEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getServerUserKey(user) {
  return String(user?.id || "").trim()
    || normalizeServerEmail(user?.email)
    || String(user?.username || "").trim().toLowerCase();
}

function mergeServerAuthUsers(existingUsers, incomingUsers) {
  const merged = new Map();
  [...(Array.isArray(existingUsers) ? existingUsers : []), ...(Array.isArray(incomingUsers) ? incomingUsers : [])]
    .filter((user) => user && typeof user === "object")
    .forEach((user) => {
      const key = getServerUserKey(user);
      if (!key) {
        return;
      }
      merged.set(key, {
        ...merged.get(key),
        ...user,
        updatedAt: user.updatedAt || new Date().toISOString(),
      });
    });
  return Array.from(merged.values());
}

async function upsertSharedAuthUser(user, accessControl) {
  if (!user || typeof user !== "object") {
    throw new Error("invalid-user");
  }

  const current = await readSharedStateBackend();
  const currentPayload = current?.payload && typeof current.payload === "object" ? current.payload : {};
  const currentSecurity = currentPayload.security && typeof currentPayload.security === "object"
    ? currentPayload.security
    : {};
  const nextPayload = {
    ...currentPayload,
    sharedState: currentPayload.sharedState || currentPayload.state || { clients: [], quoteHistory: [] },
    config: currentPayload.config || {},
    security: {
      ...currentSecurity,
      authUsers: mergeServerAuthUsers(currentSecurity.authUsers, [user]),
      accessControl: accessControl && typeof accessControl === "object"
        ? accessControl
        : currentSecurity.accessControl,
    },
  };

  return writeSharedStateBackend(nextPayload);
}

function appendLocalEmailOutbox(entry) {
  ensureDataFile();
  let current = { sent: [] };
  try {
    current = JSON.parse(fs.readFileSync(EMAIL_OUTBOX_FILE, "utf8"));
    if (!Array.isArray(current.sent)) {
      current.sent = [];
    }
  } catch {
    current = { sent: [] };
  }
  current.sent.unshift(entry);
  current.sent = current.sent.slice(0, 200);
  fs.writeFileSync(EMAIL_OUTBOX_FILE, JSON.stringify(current, null, 2), "utf8");
  return current;
}

function sendJson(response, statusCode, body) {
  const content = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(content),
  });
  response.end(content);
}

function sendText(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(body);
}

function getJsonBodyOrNull(rawBody) {
  if (!rawBody) {
    return null;
  }
  return JSON.parse(rawBody);
}

function buildSessionPayload(request) {
  const entry = getSecuritySession(request);
  return {
    developerLoggedIn: Boolean(entry?.session?.role === "developer"),
    configUnlocked: Boolean(entry?.session?.configUnlocked),
    username: entry?.session?.username || "",
    developer: getDeveloperRuntimeStatus(),
  };
}

function getSafeFilePath(requestPath) {
  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  const decoded = decodeURIComponent(normalized);
  const resolved = path.resolve(ROOT_DIR, `.${decoded}`);
  if (!resolved.startsWith(ROOT_DIR)) {
    return null;
  }
  return resolved;
}

function serveStaticFile(requestPath, response) {
  const filePath = getSafeFilePath(requestPath);
  if (!filePath) {
    sendText(response, 403, "Acesso negado.");
    return;
  }
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      sendText(response, 404, "Arquivo não encontrado.");
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 5 * 1024 * 1024) {
        reject(new Error("payload-too-large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function buildVerificationEmailPayload(payload) {
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  const expiresText = expiresAt && !Number.isNaN(expiresAt.getTime())
    ? new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(expiresAt)
    : "alguns minutos";
  return {
    subject: "GrafiCalc | Confirme seu e-mail",
    html: `
      <div style="font-family:Segoe UI,Arial,sans-serif;padding:24px;background:#f8f6f0;color:#1f2a2f">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e6dccb">
          <h1 style="margin:0 0 12px;font-size:24px">Confirmação de acesso ao GrafiCalc</h1>
          <p style="margin:0 0 18px;line-height:1.6">Olá, ${escapeHtmlForEmail(payload.username || "cliente")}.</p>
          <p style="margin:0 0 18px;line-height:1.6">Seu código para liberar o acesso é:</p>
          <div style="margin:0 0 20px;padding:18px 20px;border-radius:16px;background:#f1faf4;border:1px solid #cde9d4;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;color:#176b6b">${escapeHtmlForEmail(payload.code || "")}</div>
          <p style="margin:0 0 12px;line-height:1.6">Validade: até ${escapeHtmlForEmail(expiresText)}.</p>
          <p style="margin:0;line-height:1.6;color:#5a6b71">Se você não solicitou esse acesso, ignore este e-mail.</p>
        </div>
      </div>
    `.trim(),
    text: [
      `Olá, ${payload.username || "cliente"}.`,
      "",
      "Seu código para liberar o acesso ao GrafiCalc é:",
      String(payload.code || ""),
      "",
      `Validade: até ${expiresText}.`,
      "",
      "Se você não solicitou esse acesso, ignore este e-mail.",
    ].join("\n"),
  };
}

function escapeHtmlForEmail(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function deliverVerificationEmail(payload) {
  const message = buildVerificationEmailPayload(payload);
  if (EMAIL_PROVIDER_MODE === "resend" && RESEND_API_KEY && RESEND_FROM_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [payload.email],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "resend-delivery-failed");
    }
    return {
      deliveryMode: "resend-api",
      message: "Código enviado automaticamente por e-mail.",
    };
  }

  appendLocalEmailOutbox({
    id: `mail-${Date.now()}`,
    type: "email-verification",
    to: payload.email,
    username: payload.username || "",
    subject: message.subject,
    text: message.text,
    html: message.html,
    code: payload.code,
    company: payload.company || "",
    expiresAt: payload.expiresAt || "",
    sentAt: new Date().toISOString(),
    mode: "local-outbox",
  });
  return {
    deliveryMode: "local-outbox",
    message: "Código salvo na caixa de saída local para testes.",
  };
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);

  if (requestUrl.pathname === "/api/health") {
    sendJson(response, 200, {
      ok: true,
      mode: "local-integration",
      updatedAt: new Date().toISOString(),
      sharedStateFile: SHARED_STATE_FILE,
      sharedBackendMode: SHARED_BACKEND_MODE,
      supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
      tenantSlug: GRAFICALC_TENANT_SLUG,
      developer: getDeveloperRuntimeStatus(),
      email: getEmailRuntimeStatus(),
    });
    return;
  }

  if (requestUrl.pathname === "/api/auth/session") {
    if (request.method !== "GET") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    sendJson(response, 200, {
      ok: true,
      ...buildSessionPayload(request),
    });
    return;
  }

  if (requestUrl.pathname === "/api/auth/developer-login") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    try {
      const body = getJsonBodyOrNull(await readRequestBody(request));
      if (!DEVELOPER_USERNAME || !DEVELOPER_PASSWORD) {
        sendJson(response, 503, {
          ok: false,
          error: "developer-auth-not-configured",
        });
        return;
      }
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "").trim();
      if (!username || !password) {
        sendJson(response, 400, { ok: false, error: "missing-credentials" });
        return;
      }
      if (username.toLowerCase() !== DEVELOPER_USERNAME.toLowerCase() || password !== DEVELOPER_PASSWORD) {
        sendJson(response, 401, { ok: false, error: "invalid-credentials" });
        return;
      }
      const { token, session } = createSecuritySession({
        role: "developer",
        username: DEVELOPER_USERNAME,
        configUnlocked: false,
      });
      applySecuritySessionCookie(response, token);
      sendJson(response, 200, {
        ok: true,
        developerLoggedIn: true,
        configUnlocked: Boolean(session.configUnlocked),
        username: session.username,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error?.message || "developer-login-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/logout") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    const entry = getSecuritySession(request);
    clearSecuritySession(response, entry?.token);
    sendJson(response, 200, {
      ok: true,
      developerLoggedIn: false,
      configUnlocked: false,
    });
    return;
  }

  if (requestUrl.pathname === "/api/config/unlock") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    const entry = getSecuritySession(request);
    if (!entry || entry.session.role !== "developer") {
      sendJson(response, 401, { ok: false, error: "developer-session-required" });
      return;
    }
    try {
      const body = getJsonBodyOrNull(await readRequestBody(request));
      const password = String(body?.password || "").trim();
      if (!CONFIG_ACCESS_PASSWORD) {
        sendJson(response, 503, { ok: false, error: "config-password-not-configured" });
        return;
      }
      if (!password) {
        sendJson(response, 400, { ok: false, error: "missing-password" });
        return;
      }
      if (password !== CONFIG_ACCESS_PASSWORD) {
        sendJson(response, 403, { ok: false, error: "invalid-password" });
        return;
      }
      entry.session.configUnlocked = true;
      SECURITY_SESSIONS.set(entry.token, entry.session);
      applySecuritySessionCookie(response, entry.token);
      sendJson(response, 200, {
        ok: true,
        configUnlocked: true,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error?.message || "config-unlock-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/send-verification-code") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : null;
      if (!payload || typeof payload !== "object") {
        sendJson(response, 400, { error: "invalid-payload" });
        return;
      }
      if (!payload.email || !payload.code) {
        sendJson(response, 400, { error: "missing-email-or-code" });
        return;
      }
      const delivery = await deliverVerificationEmail(payload);
      sendJson(response, 200, {
        ok: true,
        ...delivery,
        sentAt: new Date().toISOString(),
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error?.message || "email-delivery-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/users") {
    if (request.method !== "POST") {
      sendJson(response, 405, { error: "method-not-allowed" });
      return;
    }
    try {
      const body = await readRequestBody(request);
      const payload = body ? JSON.parse(body) : null;
      if (!payload || typeof payload !== "object" || !payload.user) {
        sendJson(response, 400, { error: "invalid-payload" });
        return;
      }
      const nextState = await upsertSharedAuthUser(payload.user, payload.accessControl);
      sendJson(response, 200, {
        ok: true,
        updatedAt: nextState.updatedAt || new Date().toISOString(),
        user: payload.user,
      });
    } catch (error) {
      sendJson(response, 500, {
        ok: false,
        error: error?.message || "auth-user-save-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/shared-state") {
    if (request.method === "GET") {
      try {
        sendJson(response, 200, await readSharedStateBackend());
      } catch (error) {
        sendJson(response, 500, {
          error: "shared-state-read-failed",
          detail: error?.message || "unknown-error",
          backend: SHARED_BACKEND_MODE,
        });
      }
      return;
    }

    if (request.method === "PUT") {
      try {
        const body = await readRequestBody(request);
        const payload = body ? JSON.parse(body) : null;
        if (!payload || typeof payload !== "object") {
          sendJson(response, 400, { error: "invalid-payload" });
          return;
        }
        const nextState = await writeSharedStateBackend(payload);
        sendJson(response, 200, nextState);
      } catch (error) {
        sendJson(response, 400, {
          error: error && error.message === "payload-too-large" ? "payload-too-large" : "shared-state-write-failed",
          detail: error?.message || "invalid-json",
          backend: SHARED_BACKEND_MODE,
        });
      }
      return;
    }

    sendJson(response, 405, { error: "method-not-allowed" });
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendText(response, 405, "Método não permitido.");
    return;
  }

  serveStaticFile(requestUrl.pathname, response);
}

const server = http.createServer(handleRequest);

module.exports = handleRequest;
module.exports.server = server;

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    ensureDataFile();
    console.log(`GrafiCalc local integration server on http://localhost:${PORT}`);
  });
}
