const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const os = require("os");
const net = require("net");
const { URL } = require("url");

function loadGrafiCalcLocalEnv() {
  const envPath = path.join(__dirname, "graficalc.local-env.ps1");
  if (!fs.existsSync(envPath)) {
    return;
  }
  try {
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*\$env:([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"([^"]*)"\s*$/);
      if (!match) {
        continue;
      }
      const [, key, value] = match;
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // If local env cannot be read, the app falls back to current process env.
  }
}

loadGrafiCalcLocalEnv();

const PORT = Number(process.env.PORT || 3210);
const HOST = process.env.HOST || "0.0.0.0";
const ROOT_DIR = __dirname;
const DATA_DIR = process.env.GRAFICALC_DATA_DIR
  ? path.resolve(process.env.GRAFICALC_DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(), "graficalc")
    : path.join(ROOT_DIR, "work");
const SHARED_STATE_FILE = path.join(DATA_DIR, "shared-state.local.json");
const EMAIL_OUTBOX_FILE = path.join(DATA_DIR, "email-outbox.local.json");
const EMAIL_PROVIDER_MODE = String(process.env.GRAFICALC_EMAIL_MODE || "local-outbox").trim().toLowerCase();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESEND_FROM_EMAIL = String(process.env.RESEND_FROM_EMAIL || "").trim();
const SUPABASE_URL = String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const GRAFICALC_TENANT_SLUG = String(process.env.GRAFICALC_TENANT_SLUG || "").trim().toLowerCase();
const DEVELOPER_USERNAME = String(process.env.GRAFICALC_DEVELOPER_USERNAME || "").trim();
const DEVELOPER_PASSWORD = String(process.env.GRAFICALC_DEVELOPER_PASSWORD || "").trim();
const CONFIG_ACCESS_PASSWORD = String(process.env.GRAFICALC_CONFIG_PASSWORD || "").trim();
const IS_DEPLOYED_RUNTIME = Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";

function resolveSessionSecret() {
  const configuredSecret = String(process.env.GRAFICALC_SESSION_SECRET || "").trim();
  if (configuredSecret) {
    return configuredSecret;
  }
  if (IS_DEPLOYED_RUNTIME) {
    throw new Error("GRAFICALC_SESSION_SECRET must be configured in deployed environments.");
  }
  // Local-only ephemeral key: restarting the local server invalidates all legacy sessions.
  return crypto.randomBytes(32).toString("base64url");
}

const SESSION_SECRET = resolveSessionSecret();
const SHARED_BACKEND_MODE = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local-file";
const TENANT_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
let supabaseTenantPromise = null;

if (SHARED_BACKEND_MODE === "supabase" && !TENANT_SLUG_PATTERN.test(GRAFICALC_TENANT_SLUG)) {
  throw new Error("GRAFICALC_TENANT_SLUG obrigatorio e invalido para o backend Supabase.");
}
const SESSION_COOKIE_NAME = "graficalc_session";
const SESSION_TTL_MS = 60 * 60 * 1000;
const TRUST_PROXY = String(process.env.GRAFICALC_TRUST_PROXY || "").trim().toLowerCase() === "true";
const VERIFICATION_CODE_TTL_MS = resolveVerificationCodeTtlMs();
const VERIFICATION_CODE_MAX_ATTEMPTS = 5;
const JSON_BODY_LIMITS = Object.freeze({
  authentication: 16 * 1024,
  verification: 16 * 1024,
  managedUser: 256 * 1024,
  // Shared state can contain the product catalog and configuration. Keep the
  // legacy ceiling here, but do not grant it to small authentication routes.
  sharedState: 5 * 1024 * 1024,
});
const RATE_LIMIT_MAX_ENTRIES = 10000;
const VERIFICATION_CODE_MAX_ENTRIES = 5000;
const RATE_LIMIT_POLICIES = Object.freeze({
  developerLogin: { limit: 5, windowMs: resolveRateLimitWindowMs(15 * 60 * 1000) },
  configUnlock: { limit: 5, windowMs: resolveRateLimitWindowMs(15 * 60 * 1000) },
  verificationEmailCooldown: { limit: 1, windowMs: resolveRateLimitWindowMs(60 * 1000) },
  verificationEmailHourly: { limit: 5, windowMs: resolveRateLimitWindowMs(60 * 60 * 1000) },
  verificationIpHourly: { limit: 20, windowMs: resolveRateLimitWindowMs(60 * 60 * 1000) },
  verificationAttemptIp: { limit: 20, windowMs: resolveRateLimitWindowMs(15 * 60 * 1000) },
});
const RATE_LIMIT_STORE = new Map();
const VERIFICATION_CODE_STORE = new Map();

function resolveVerificationCodeTtlMs() {
  const configured = Number(process.env.GRAFICALC_VERIFICATION_CODE_TTL_MS);
  if (!Number.isFinite(configured) || configured <= 0) {
    return 10 * 60 * 1000;
  }
  // A short TTL is accepted only for explicit local integration tests. Production
  // never accepts a code lifetime below one minute.
  const minimum = IS_DEPLOYED_RUNTIME ? 60 * 1000 : 1000;
  return Math.max(minimum, Math.min(Math.floor(configured), 60 * 60 * 1000));
}

function resolveRateLimitWindowMs(defaultWindowMs) {
  const testWindow = Number(process.env.GRAFICALC_SECURITY_TEST_WINDOW_MS);
  if (process.env.NODE_ENV !== "test" || !Number.isFinite(testWindow) || testWindow <= 0) {
    return defaultWindowMs;
  }
  // This switch is intentionally inert outside automated/local tests. It makes
  // rate-limit expiry verifiable without weakening any deployed environment.
  return Math.max(1000, Math.min(Math.floor(testWindow), defaultWindowMs));
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

// This legacy server still serves the static frontend from the project root.
// Keep that layout for compatibility, but make the publicly reachable surface explicit.
const STATIC_ROOT_DIR = ROOT_DIR;
const STATIC_ROOT_REALPATH = fs.realpathSync(STATIC_ROOT_DIR);
const STATIC_PUBLIC_ROOT_FILES = new Set([
  "index.html",
  "styles.css",
  "app.mjs",
  "catalogo-loja.seed.js",
  "catalogo-loja.seed.mjs",
]);
const STATIC_PUBLIC_DIRECTORIES = new Set(["assets", "public"]);

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
      try {
        acc[key] = decodeURIComponent(value);
      } catch {
        // Ignore malformed cookie values instead of failing the request.
      }
      return acc;
    }, {});
}

function requestUsesSecureTransport(request) {
  if (IS_DEPLOYED_RUNTIME) {
    return true;
  }
  const forwardedProtocol = String(request?.headers?.["x-forwarded-proto"] || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  return forwardedProtocol === "https" || Boolean(request?.socket?.encrypted);
}

function buildCookieHeader(name, value, maxAgeSeconds, secure) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
  ];
  if (secure) {
    parts.push("Secure");
  }
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

function base64UrlEncode(value) {
  return Buffer.from(String(value || ""), "utf8").toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(String(value || ""), "base64url").toString("utf8");
}

function signSessionPayload(encodedPayload) {
  return crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(String(encodedPayload || ""))
    .digest("base64url");
}

function serializeSecuritySession(session) {
  const payload = base64UrlEncode(JSON.stringify(session));
  const signature = signSessionPayload(payload);
  return `${payload}.${signature}`;
}

function parseSecuritySessionToken(token) {
  if (!token || !String(token).includes(".")) {
    return null;
  }
  const parts = String(token).split(".");
  if (parts.length !== 2) {
    return null;
  }
  const [payload, signature] = parts;
  if (!payload || !signature) {
    return null;
  }
  const expected = signSessionPayload(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }
  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return null;
  }
}

function createSecuritySession(data = {}) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session = {
    role: data.role || "developer",
    username: data.username || "",
    configUnlocked: Boolean(data.configUnlocked),
    sessionId: crypto.randomBytes(16).toString("base64url"),
    createdAt: new Date().toISOString(),
    expiresAt,
  };
  const token = serializeSecuritySession(session);
  return { token, session };
}

function getSecuritySession(request) {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies[SESSION_COOKIE_NAME];
  if (!token) {
    return null;
  }
  const session = parseSecuritySessionToken(token);
  if (!session) {
    return null;
  }
  if (Number(session.expiresAt || 0) <= Date.now()) {
    return null;
  }
  return { token, session };
}

function requireDeveloperSession(request, response) {
  const entry = getSecuritySession(request);
  if (!entry || entry.session.role !== "developer") {
    sendJson(response, 401, { ok: false, error: "authentication-required" });
    return null;
  }
  return entry;
}

function getExpectedRequestHost(request) {
  if (TRUST_PROXY) {
    const forwardedHost = String(request.headers["x-forwarded-host"] || "").split(",")[0].trim();
    if (forwardedHost) {
      return forwardedHost;
    }
  }
  return String(request.headers.host || "").trim();
}

function getExpectedRequestProtocol(request) {
  if (TRUST_PROXY) {
    const forwardedProtocol = String(request.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
    if (forwardedProtocol === "http" || forwardedProtocol === "https") {
      return `${forwardedProtocol}:`;
    }
  }
  return requestUsesSecureTransport(request) ? "https:" : "http:";
}

function hasSameOrigin(request) {
  const origin = String(request.headers.origin || "").trim();
  if (!origin) {
    // Same-origin browser requests may omit Origin. Authentication still protects
    // these legacy routes, while cross-site browser requests must provide it.
    return true;
  }
  try {
    const parsedOrigin = new URL(origin);
    return parsedOrigin.host === getExpectedRequestHost(request)
      && parsedOrigin.protocol === getExpectedRequestProtocol(request);
  } catch {
    return false;
  }
}

function hasLegacyMutationProof(request) {
  return String(request.headers["x-graficalc-request"] || "") === "1" && hasSameOrigin(request);
}

function clearSecuritySession(request, response) {
  appendSetCookie(response, buildCookieHeader(SESSION_COOKIE_NAME, "", 0, requestUsesSecureTransport(request)));
}

function applySecuritySessionCookie(request, response, token) {
  appendSetCookie(response, buildCookieHeader(
    SESSION_COOKIE_NAME,
    token,
    SESSION_TTL_MS / 1000,
    requestUsesSecureTransport(request)
  ));
}

function secureStringEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
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
    // Do not propagate provider response bodies: they can contain operational
    // details that are not safe to return from this backend.
    await response.text().catch(() => "");
    throw new Error(`supabase-request-failed-${response.status}`);
  }

  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("supabase-invalid-json-response");
  }
}

async function findSupabaseTenant() {
  const query = `/rest/v1/graficalc_tenants?slug=eq.${encodeURIComponent(GRAFICALC_TENANT_SLUG)}&select=id,slug,name&limit=1`;
  const existing = await supabaseRequest(query, { method: "GET" });
  if (Array.isArray(existing) && existing[0]?.id) {
    return existing[0];
  }
  return null;
}

async function bootstrapSupabaseTenant() {
  const existing = await findSupabaseTenant();
  if (existing) {
    return existing;
  }

  // The database unique constraint on slug is the concurrency boundary. A second
  // server can race this creation safely; both instances re-read afterwards.
  await supabaseRequest("/rest/v1/graficalc_tenants?on_conflict=slug", {
    method: "POST",
    headers: {
      Prefer: "resolution=ignore-duplicates,return=representation",
    },
    body: JSON.stringify([{
      slug: GRAFICALC_TENANT_SLUG,
      name: "GrafiCalc Workspace",
    }]),
  });

  const created = await findSupabaseTenant();
  if (!created) {
    throw new Error("supabase-tenant-create-failed");
  }

  return created;
}

function ensureSupabaseTenant() {
  if (SHARED_BACKEND_MODE !== "supabase") {
    throw new Error("supabase-backend-not-enabled");
  }
  if (!supabaseTenantPromise) {
    supabaseTenantPromise = bootstrapSupabaseTenant().catch((error) => {
      supabaseTenantPromise = null;
      throw error;
    });
  }
  return supabaseTenantPromise;
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

function normalizeManagedSharedUser(user) {
  if (!user || typeof user !== "object") {
    throw new Error("invalid-user");
  }
  const role = String(user.role || "user").trim().toLowerCase();
  if (role === "developer") {
    throw new Error("developer-role-managed-by-server");
  }
  if (role !== "user" && role !== "employee") {
    throw new Error("invalid-managed-user-role");
  }
  return {
    ...user,
    role,
  };
}

function toSafeSharedUserResponse(user) {
  return {
    id: String(user?.id || ""),
    username: String(user?.username || ""),
    email: normalizeServerEmail(user?.email),
    role: String(user?.role || "user"),
    status: String(user?.status || "pending"),
    updatedAt: String(user?.updatedAt || ""),
  };
}

async function upsertSharedAuthUser(user, accessControl, actor) {
  if (!actor || actor.role !== "developer") {
    throw new Error("developer-session-required");
  }
  if (!user || typeof user !== "object") {
    throw new Error("invalid-user");
  }
  const managedUser = normalizeManagedSharedUser(user);

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
      authUsers: mergeServerAuthUsers(currentSecurity.authUsers, [managedUser]),
      accessControl: accessControl && typeof accessControl === "object"
        ? accessControl
        : currentSecurity.accessControl,
    },
  };

  const nextState = await writeSharedStateBackend(nextPayload);
  return {
    nextState,
    user: toSafeSharedUserResponse(managedUser),
  };
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

function buildContentSecurityPolicy() {
  // The legacy frontend uses local scripts, but creates trusted dynamic style
  // attributes for charts and progress indicators. Removing unsafe-inline from
  // style-src requires a frontend migration, so keep this exception explicit.
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "manifest-src 'self'",
  ].join("; ");
}

function applyGlobalSecurityHeaders(request, response) {
  response.setHeader("Content-Security-Policy", buildContentSecurityPolicy());
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader(
    "Permissions-Policy",
    "accelerometer=(), autoplay=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), picture-in-picture=(), usb=()"
  );
  response.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  // HSTS only belongs on a production HTTPS deployment. Local HTTP remains
  // usable for the legacy integration server and its automated tests.
  if (IS_DEPLOYED_RUNTIME && requestUsesSecureTransport(request)) {
    response.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  const content = JSON.stringify(body);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(content),
    ...extraHeaders,
  });
  response.end(content);
}

function sendText(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders,
  });
  response.end(body);
}

function sendMethodNotAllowed(response, allowedMethods, responseType = "json") {
  const allow = Array.isArray(allowedMethods) ? allowedMethods.join(", ") : String(allowedMethods || "");
  if (responseType === "text") {
    sendText(response, 405, "Método não permitido.", { Allow: allow });
    return;
  }
  sendJson(response, 405, { ok: false, error: "method-not-allowed" }, { Allow: allow });
}

function normalizeRemoteAddress(value) {
  const candidate = String(value || "").trim();
  const withoutMappedPrefix = candidate.startsWith("::ffff:") ? candidate.slice(7) : candidate;
  return net.isIP(withoutMappedPrefix) ? withoutMappedPrefix : "unknown";
}

function getRequestClientIp(request) {
  // Proxies are opt-in. Without this explicit setting, headers are attacker
  // controlled and the socket address is the only trustworthy source.
  if (TRUST_PROXY) {
    const forwarded = String(request.headers["x-forwarded-for"] || "").split(",")[0].trim();
    const forwardedIp = normalizeRemoteAddress(forwarded);
    if (forwardedIp !== "unknown") {
      return forwardedIp;
    }
  }
  return normalizeRemoteAddress(request.socket?.remoteAddress);
}

function hashSecurityIdentity(value) {
  return crypto.createHash("sha256").update(String(value || "unknown"), "utf8").digest("base64url");
}

function rateLimitKey(scope, identity) {
  return `${scope}:${hashSecurityIdentity(identity)}`;
}

function touchRateLimitEntry(key, entry) {
  RATE_LIMIT_STORE.delete(key);
  RATE_LIMIT_STORE.set(key, entry);
  while (RATE_LIMIT_STORE.size > RATE_LIMIT_MAX_ENTRIES) {
    const oldestKey = RATE_LIMIT_STORE.keys().next().value;
    RATE_LIMIT_STORE.delete(oldestKey);
  }
}

function cleanupSecurityStores(now = Date.now()) {
  for (const [key, entry] of RATE_LIMIT_STORE) {
    entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > now - entry.windowMs);
    if (!entry.timestamps.length) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
  for (const [key, entry] of VERIFICATION_CODE_STORE) {
    if (entry.expiresAt <= now) {
      VERIFICATION_CODE_STORE.delete(key);
    }
  }
}

function getRateLimitStatus(scope, identity, policy, now = Date.now()) {
  cleanupSecurityStores(now);
  const key = rateLimitKey(scope, identity);
  const entry = RATE_LIMIT_STORE.get(key);
  if (!entry) {
    return { limited: false, key };
  }
  const timestamps = entry.timestamps.filter((timestamp) => timestamp > now - policy.windowMs);
  entry.timestamps = timestamps;
  entry.windowMs = policy.windowMs;
  touchRateLimitEntry(key, entry);
  if (timestamps.length < policy.limit) {
    return { limited: false, key };
  }
  const retryAfterSeconds = Math.max(1, Math.ceil((timestamps[0] + policy.windowMs - now) / 1000));
  return { limited: true, key, retryAfterSeconds };
}

function recordRateLimitFailure(scope, identity, policy, now = Date.now()) {
  const key = rateLimitKey(scope, identity);
  const entry = RATE_LIMIT_STORE.get(key) || { timestamps: [], windowMs: policy.windowMs };
  entry.windowMs = policy.windowMs;
  entry.timestamps = entry.timestamps.filter((timestamp) => timestamp > now - policy.windowMs);
  entry.timestamps.push(now);
  touchRateLimitEntry(key, entry);
}

function clearRateLimit(scope, identity) {
  RATE_LIMIT_STORE.delete(rateLimitKey(scope, identity));
}

function sendRateLimitResponse(response, retryAfterSeconds) {
  sendJson(response, 429, {
    ok: false,
    error: "too-many-requests",
  }, {
    "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds || 1))),
  });
}

function normalizeVerificationEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (
    !email
    || email.length > 254
    || /[\u0000-\u001F\u007F\r\n]/.test(email)
    || /[^\x20-\x7E]/.test(email)
  ) {
    return "";
  }

  const separatorIndex = email.lastIndexOf("@");
  if (separatorIndex <= 0 || separatorIndex === email.length - 1) {
    return "";
  }
  const localPart = email.slice(0, separatorIndex);
  const domainPart = email.slice(separatorIndex + 1);
  if (
    localPart.length > 64
    || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/i.test(localPart)
    || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domainPart)
  ) {
    return "";
  }
  return email;
}

function verificationCodeKey(email) {
  return hashSecurityIdentity(`verification:${email}`);
}

function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(`verification-code:${code}`, "utf8").digest("base64url");
}

function createVerificationCode() {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

function issueServerVerificationCode(email, now = Date.now()) {
  cleanupSecurityStores(now);
  const key = verificationCodeKey(email);
  const code = createVerificationCode();
  const entry = {
    codeHash: hashVerificationCode(code),
    expiresAt: now + VERIFICATION_CODE_TTL_MS,
    failedAttempts: 0,
  };
  VERIFICATION_CODE_STORE.delete(key);
  VERIFICATION_CODE_STORE.set(key, entry);
  while (VERIFICATION_CODE_STORE.size > VERIFICATION_CODE_MAX_ENTRIES) {
    VERIFICATION_CODE_STORE.delete(VERIFICATION_CODE_STORE.keys().next().value);
  }
  return { code, expiresAt: new Date(entry.expiresAt).toISOString() };
}

function invalidateServerVerificationCode(email) {
  VERIFICATION_CODE_STORE.delete(verificationCodeKey(email));
}

function verifyServerVerificationCode(email, code, now = Date.now()) {
  cleanupSecurityStores(now);
  const key = verificationCodeKey(email);
  const entry = VERIFICATION_CODE_STORE.get(key);
  if (!entry || entry.expiresAt <= now) {
    VERIFICATION_CODE_STORE.delete(key);
    return { ok: false, reason: "invalid" };
  }
  if (entry.failedAttempts >= VERIFICATION_CODE_MAX_ATTEMPTS) {
    return {
      ok: false,
      reason: "limited",
      retryAfterSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000)),
    };
  }
  const suppliedCode = String(code || "").trim();
  if (!/^\d{6}$/.test(suppliedCode) || !secureStringEqual(hashVerificationCode(suppliedCode), entry.codeHash)) {
    entry.failedAttempts += 1;
    VERIFICATION_CODE_STORE.delete(key);
    VERIFICATION_CODE_STORE.set(key, entry);
    return { ok: false, reason: "invalid" };
  }
  VERIFICATION_CODE_STORE.delete(key);
  return { ok: true, verifiedAt: new Date(now).toISOString() };
}

function buildSessionPayload(request) {
  const entry = getSecuritySession(request);
  return {
    developerLoggedIn: Boolean(entry?.session?.role === "developer"),
    configUnlocked: Boolean(entry?.session?.configUnlocked),
    username: entry?.session?.username || "",
  };
}

function isPathInside(rootPath, candidatePath) {
  const relativePath = path.relative(rootPath, candidatePath);
  return Boolean(relativePath)
    && relativePath !== ".."
    && !relativePath.startsWith(`..${path.sep}`)
    && !path.isAbsolute(relativePath);
}

function getSafeFilePath(requestPath) {
  if (typeof requestPath !== "string") {
    return null;
  }

  const normalized = requestPath === "/" ? "/index.html" : requestPath;
  let decoded;
  try {
    decoded = decodeURIComponent(normalized);
  } catch {
    return null;
  }

  // URLs must use forward slashes. Reject backslashes rather than translating
  // them, because Windows treats them as path separators.
  if (
    !decoded.startsWith("/")
    || decoded.startsWith("//")
    || decoded.includes("\0")
    || decoded.includes("\\")
  ) {
    return null;
  }

  const relativeUrlPath = decoded.slice(1);
  const segments = relativeUrlPath.split("/");
  if (
    !relativeUrlPath
    || path.win32.isAbsolute(relativeUrlPath)
    || segments.some((segment) => !segment || segment === "." || segment === ".." || segment.startsWith("."))
  ) {
    return null;
  }

  const resolved = path.resolve(STATIC_ROOT_DIR, ...segments);
  if (!isPathInside(STATIC_ROOT_DIR, resolved)) {
    return null;
  }

  const relativePath = path.relative(STATIC_ROOT_DIR, resolved);
  const [topLevelEntry] = relativePath.split(path.sep);
  const isKnownPublicFile = STATIC_PUBLIC_ROOT_FILES.has(relativePath)
    || STATIC_PUBLIC_DIRECTORIES.has(topLevelEntry);
  // Extensionless paths are SPA routes, not file reads. Let serveAppFile fall
  // back to index.html for them without granting access to project files.
  if (!isKnownPublicFile && path.extname(relativePath)) {
    return null;
  }

  return resolved;
}

function resolvePublicFile(filePath, callback) {
  fs.realpath(filePath, (realpathError, realFilePath) => {
    if (realpathError) {
      callback({ state: "missing" });
      return;
    }

    // fs.realpath follows symlinks, so this rejects links that leave the public root.
    if (!isPathInside(STATIC_ROOT_REALPATH, realFilePath)) {
      callback({ state: "denied" });
      return;
    }

    const extension = path.extname(realFilePath).toLowerCase();
    const contentType = MIME_TYPES[extension];
    if (!contentType) {
      callback({ state: "denied" });
      return;
    }

    fs.stat(realFilePath, (statError, stats) => {
      if (statError || !stats.isFile()) {
        callback({ state: "missing" });
        return;
      }
      callback({ state: "ok", filePath: realFilePath, contentType });
    });
  });
}

function getStaticCacheControl(filePath) {
  return path.extname(filePath).toLowerCase() === ".html"
    ? "no-cache"
    : "public, max-age=300, must-revalidate";
}

function serveResolvedFile(filePath, response, contentType, requestMethod = "GET") {
  if (!isPathInside(STATIC_ROOT_REALPATH, filePath) || !contentType) {
    sendText(response, 403, "Acesso negado.");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": getStaticCacheControl(filePath),
  });
  if (requestMethod === "HEAD") {
    response.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => response.destroy());
  stream.pipe(response);
}

function serveStaticFile(requestPath, response, requestMethod = "GET") {
  const filePath = getSafeFilePath(requestPath);
  if (!filePath) {
    sendText(response, 403, "Acesso negado.");
    return;
  }

  resolvePublicFile(filePath, (result) => {
    if (result.state === "denied") {
      sendText(response, 403, "Acesso negado.");
      return;
    }
    if (result.state !== "ok") {
      sendText(response, 404, "Arquivo não encontrado.");
      return;
    }
    serveResolvedFile(result.filePath, response, result.contentType, requestMethod);
  });
}

function serveAppFile(requestPath, response, requestMethod = "GET") {
  const filePath = getSafeFilePath(requestPath);
  if (!filePath) {
    sendText(response, 403, "Acesso negado.");
    return;
  }

  resolvePublicFile(filePath, (result) => {
    if (result.state === "denied") {
      sendText(response, 403, "Acesso negado.");
      return;
    }
    if (result.state === "ok") {
      serveResolvedFile(result.filePath, response, result.contentType, requestMethod);
      return;
    }

    const isApiRoute = requestPath.startsWith("/api/");
    const looksLikeFile = Boolean(path.extname(requestPath));
    const indexPath = getSafeFilePath("/");
    if (!isApiRoute && !looksLikeFile && indexPath) {
      resolvePublicFile(indexPath, (indexResult) => {
        if (indexResult.state === "ok") {
          serveResolvedFile(indexResult.filePath, response, indexResult.contentType, requestMethod);
          return;
        }
        sendText(response, indexResult.state === "denied" ? 403 : 404, "Arquivo não encontrado.");
      });
      return;
    }
    sendText(response, 404, "Arquivo não encontrado.");
  });
}

function createRequestBodyError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function isJsonContentType(request) {
  const rawContentType = String(request.headers["content-type"] || "").trim().toLowerCase();
  const mediaType = rawContentType.split(";", 1)[0].trim();
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function sendJsonRequestError(response, error, fallbackError = "invalid-request") {
  const code = String(error?.code || error?.message || "");
  if (code === "unsupported-media-type") {
    sendJson(response, 415, { ok: false, error: "unsupported-media-type" });
    return true;
  }
  if (code === "payload-too-large") {
    sendJson(response, 413, { ok: false, error: "payload-too-large" });
    return true;
  }
  if (code === "invalid-json" || code === "empty-body") {
    sendJson(response, 400, { ok: false, error: fallbackError });
    return true;
  }
  return false;
}

function readRequestBody(request, maxBytes = JSON_BODY_LIMITS.sharedState) {
  return new Promise((resolve, reject) => {
    const declaredLength = Number(request.headers["content-length"]);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      request.resume();
      reject(createRequestBodyError("payload-too-large"));
      return;
    }

    const chunks = [];
    let receivedBytes = 0;
    let settled = false;
    const fail = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };
    request.on("data", (chunk) => {
      if (settled) {
        return;
      }
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      receivedBytes += buffer.length;
      if (receivedBytes > maxBytes) {
        fail(createRequestBodyError("payload-too-large"));
        request.resume();
        return;
      }
      chunks.push(buffer);
    });
    request.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks).toString("utf8"));
      }
    });
    request.on("error", fail);
  });
}

async function readJsonRequest(request, maxBytes) {
  if (!isJsonContentType(request)) {
    throw createRequestBodyError("unsupported-media-type");
  }
  const rawBody = await readRequestBody(request, maxBytes);
  if (!rawBody.trim()) {
    throw createRequestBodyError("empty-body");
  }
  try {
    return JSON.parse(rawBody);
  } catch {
    throw createRequestBodyError("invalid-json");
  }
}

function normalizeEmailTemplateText(value, fallback = "cliente") {
  const normalized = String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, 120);
  return normalized || fallback;
}

function isSafeEmailHeaderValue(value, maxLength = 200) {
  const header = String(value || "").trim();
  return Boolean(header)
    && header.length <= maxLength
    && !/[\u0000\r\n]/.test(header);
}

function buildVerificationEmailPayload(payload) {
  const verificationCode = String(payload?.code || "").trim();
  if (!/^\d{6}$/.test(verificationCode)) {
    throw createRequestBodyError("invalid-verification-email-payload");
  }
  const username = normalizeEmailTemplateText(payload?.username);
  const expiresAt = payload?.expiresAt ? new Date(payload.expiresAt) : null;
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
          <p style="margin:0 0 18px;line-height:1.6">Olá, ${escapeHtmlForEmail(username)}.</p>
          <p style="margin:0 0 18px;line-height:1.6">Seu código para liberar o acesso é:</p>
          <div style="margin:0 0 20px;padding:18px 20px;border-radius:16px;background:#f1faf4;border:1px solid #cde9d4;font-size:30px;font-weight:700;letter-spacing:8px;text-align:center;color:#176b6b">${escapeHtmlForEmail(verificationCode)}</div>
          <p style="margin:0 0 12px;line-height:1.6">Validade: até ${escapeHtmlForEmail(expiresText)}.</p>
          <p style="margin:0;line-height:1.6;color:#5a6b71">Se você não solicitou esse acesso, ignore este e-mail.</p>
        </div>
      </div>
    `.trim(),
    text: [
      `Olá, ${username}.`,
      "",
      "Seu código para liberar o acesso ao GrafiCalc é:",
      verificationCode,
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
  const recipient = normalizeVerificationEmail(payload?.email);
  if (!recipient) {
    throw createRequestBodyError("invalid-verification-email-payload");
  }
  const message = buildVerificationEmailPayload(payload);
  if (!isSafeEmailHeaderValue(message.subject) || (EMAIL_PROVIDER_MODE === "resend" && !isSafeEmailHeaderValue(RESEND_FROM_EMAIL))) {
    throw createRequestBodyError("invalid-email-header");
  }
  if (EMAIL_PROVIDER_MODE === "resend" && RESEND_API_KEY && RESEND_FROM_EMAIL) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: [recipient],
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      // Resend may include operational details in its response. The client
      // receives only a generic delivery outcome below.
      throw new Error("resend-delivery-failed");
    }
    return {
      deliveryMode: "resend-api",
      message: "Código enviado automaticamente por e-mail.",
    };
  }

  appendLocalEmailOutbox({
    id: `mail-${Date.now()}`,
    type: "email-verification",
    to: recipient,
    username: normalizeEmailTemplateText(payload.username, ""),
    subject: message.subject,
    text: message.text,
    html: message.html,
    code: payload.code,
    company: normalizeEmailTemplateText(payload.company, ""),
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
  applyGlobalSecurityHeaders(request, response);
  let requestUrl;
  try {
    requestUrl = new URL(request.url, `http://${request.headers.host || `${HOST}:${PORT}`}`);
  } catch {
    sendJson(response, 400, { ok: false, error: "invalid-request-target" });
    return;
  }
  // Keep the original path for static-file validation. WHATWG URL normalizes
  // suspicious sequences such as repeated leading slashes before the guard
  // can inspect them.
  const rawRequestPath = String(request.url || "/").split("?", 1)[0] || "/";

  if (requestUrl.pathname === "/api/health") {
    if (request.method !== "GET") {
      sendMethodNotAllowed(response, ["GET"]);
      return;
    }
    sendJson(response, 200, { ok: true });
    return;
  }

  if (requestUrl.pathname === "/api/auth/session") {
    if (request.method !== "GET") {
      sendMethodNotAllowed(response, ["GET"]);
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
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    try {
      const body = await readJsonRequest(request, JSON_BODY_LIMITS.authentication);
      if (!DEVELOPER_USERNAME || !DEVELOPER_PASSWORD) {
        sendJson(response, 503, {
          ok: false,
          error: "developer-auth-not-configured",
        });
        return;
      }
      const username = String(body?.username || "").trim();
      const password = String(body?.password || "").trim();
      const clientIp = getRequestClientIp(request);
      const identity = username.toLowerCase() || "anonymous";
      const ipLimit = getRateLimitStatus("developer-login-ip", clientIp, RATE_LIMIT_POLICIES.developerLogin);
      const identityLimit = getRateLimitStatus("developer-login-identity", identity, RATE_LIMIT_POLICIES.developerLogin);
      if (ipLimit.limited || identityLimit.limited) {
        sendRateLimitResponse(response, Math.max(ipLimit.retryAfterSeconds || 0, identityLimit.retryAfterSeconds || 0));
        return;
      }
      if (!username || !password) {
        recordRateLimitFailure("developer-login-ip", clientIp, RATE_LIMIT_POLICIES.developerLogin);
        recordRateLimitFailure("developer-login-identity", identity, RATE_LIMIT_POLICIES.developerLogin);
        sendJson(response, 401, { ok: false, error: "invalid-credentials" });
        return;
      }
      if (!secureStringEqual(username.toLowerCase(), DEVELOPER_USERNAME.toLowerCase()) || !secureStringEqual(password, DEVELOPER_PASSWORD)) {
        recordRateLimitFailure("developer-login-ip", clientIp, RATE_LIMIT_POLICIES.developerLogin);
        recordRateLimitFailure("developer-login-identity", identity, RATE_LIMIT_POLICIES.developerLogin);
        sendJson(response, 401, { ok: false, error: "invalid-credentials" });
        return;
      }
      clearRateLimit("developer-login-ip", clientIp);
      clearRateLimit("developer-login-identity", identity);
      const { token, session } = createSecuritySession({
        role: "developer",
        username: DEVELOPER_USERNAME,
        configUnlocked: false,
      });
      applySecuritySessionCookie(request, response, token);
      sendJson(response, 200, {
        ok: true,
        developerLoggedIn: true,
        configUnlocked: Boolean(session.configUnlocked),
        username: session.username,
      });
    } catch (error) {
      if (sendJsonRequestError(response, error, "invalid-login-request")) {
        return;
      }
      sendJson(response, 500, {
        ok: false,
        error: "developer-login-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/logout") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    const entry = getSecuritySession(request);
    clearSecuritySession(request, response);
    sendJson(response, 200, {
      ok: true,
      developerLoggedIn: false,
      configUnlocked: false,
    });
    return;
  }

  if (requestUrl.pathname === "/api/config/unlock") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    const entry = getSecuritySession(request);
    if (!entry || entry.session.role !== "developer") {
      sendJson(response, 401, { ok: false, error: "developer-session-required" });
      return;
    }
    try {
      const body = await readJsonRequest(request, JSON_BODY_LIMITS.authentication);
      const password = String(body?.password || "").trim();
      const clientIp = getRequestClientIp(request);
      const identity = entry.session.sessionId || entry.session.username || "developer";
      const ipLimit = getRateLimitStatus("config-unlock-ip", clientIp, RATE_LIMIT_POLICIES.configUnlock);
      const identityLimit = getRateLimitStatus("config-unlock-identity", identity, RATE_LIMIT_POLICIES.configUnlock);
      if (ipLimit.limited || identityLimit.limited) {
        sendRateLimitResponse(response, Math.max(ipLimit.retryAfterSeconds || 0, identityLimit.retryAfterSeconds || 0));
        return;
      }
      if (!CONFIG_ACCESS_PASSWORD) {
        sendJson(response, 503, { ok: false, error: "config-password-not-configured" });
        return;
      }
      if (!password) {
        recordRateLimitFailure("config-unlock-ip", clientIp, RATE_LIMIT_POLICIES.configUnlock);
        recordRateLimitFailure("config-unlock-identity", identity, RATE_LIMIT_POLICIES.configUnlock);
        sendJson(response, 403, { ok: false, error: "config-unlock-denied" });
        return;
      }
      if (!secureStringEqual(password, CONFIG_ACCESS_PASSWORD)) {
        recordRateLimitFailure("config-unlock-ip", clientIp, RATE_LIMIT_POLICIES.configUnlock);
        recordRateLimitFailure("config-unlock-identity", identity, RATE_LIMIT_POLICIES.configUnlock);
        sendJson(response, 403, { ok: false, error: "config-unlock-denied" });
        return;
      }
      clearRateLimit("config-unlock-ip", clientIp);
      clearRateLimit("config-unlock-identity", identity);
      entry.session.configUnlocked = true;
      const nextToken = serializeSecuritySession(entry.session);
      applySecuritySessionCookie(request, response, nextToken);
      sendJson(response, 200, {
        ok: true,
        configUnlocked: true,
      });
    } catch (error) {
      if (sendJsonRequestError(response, error, "invalid-config-unlock-request")) {
        return;
      }
      sendJson(response, 500, {
        ok: false,
        error: "config-unlock-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/send-verification-code") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    let issuedEmail = "";
    try {
      const payload = await readJsonRequest(request, JSON_BODY_LIMITS.verification);
      if (!payload || typeof payload !== "object") {
        sendJson(response, 400, { error: "invalid-payload" });
        return;
      }
      const email = normalizeVerificationEmail(payload.email);
      if (!email) {
        sendJson(response, 400, { ok: false, error: "invalid-email" });
        return;
      }
      const clientIp = getRequestClientIp(request);
      const limits = [
        getRateLimitStatus("verification-email-cooldown", email, RATE_LIMIT_POLICIES.verificationEmailCooldown),
        getRateLimitStatus("verification-email-hour", email, RATE_LIMIT_POLICIES.verificationEmailHourly),
        getRateLimitStatus("verification-ip-hour", clientIp, RATE_LIMIT_POLICIES.verificationIpHourly),
      ];
      const activeLimit = limits.find((limit) => limit.limited);
      if (activeLimit) {
        sendRateLimitResponse(response, activeLimit.retryAfterSeconds);
        return;
      }

      recordRateLimitFailure("verification-email-cooldown", email, RATE_LIMIT_POLICIES.verificationEmailCooldown);
      recordRateLimitFailure("verification-email-hour", email, RATE_LIMIT_POLICIES.verificationEmailHourly);
      recordRateLimitFailure("verification-ip-hour", clientIp, RATE_LIMIT_POLICIES.verificationIpHourly);
      const issued = issueServerVerificationCode(email);
      issuedEmail = email;
      const delivery = await deliverVerificationEmail({
        email,
        username: String(payload.username || "").trim(),
        company: String(payload.company || "").trim(),
        code: issued.code,
        expiresAt: issued.expiresAt,
      });
      sendJson(response, 200, {
        ok: true,
        ...delivery,
        sentAt: new Date().toISOString(),
        expiresAt: issued.expiresAt,
        resendAvailableAt: new Date(Date.now() + RATE_LIMIT_POLICIES.verificationEmailCooldown.windowMs).toISOString(),
      });
    } catch (error) {
      if (sendJsonRequestError(response, error, "invalid-verification-request")) {
        return;
      }
      if (issuedEmail) {
        invalidateServerVerificationCode(issuedEmail);
      }
      sendJson(response, 500, {
        ok: false,
        error: "email-delivery-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/verify-verification-code") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    try {
      const body = await readJsonRequest(request, JSON_BODY_LIMITS.verification);
      const email = normalizeVerificationEmail(body?.email);
      const code = String(body?.code || "").trim();
      const clientIp = getRequestClientIp(request);
      const ipLimit = getRateLimitStatus("verification-attempt-ip", clientIp, RATE_LIMIT_POLICIES.verificationAttemptIp);
      if (ipLimit.limited) {
        sendRateLimitResponse(response, ipLimit.retryAfterSeconds);
        return;
      }
      if (!email || !code) {
        recordRateLimitFailure("verification-attempt-ip", clientIp, RATE_LIMIT_POLICIES.verificationAttemptIp);
        sendJson(response, 401, { ok: false, error: "invalid-or-expired-code" });
        return;
      }
      const verification = verifyServerVerificationCode(email, code);
      if (verification.reason === "limited") {
        sendRateLimitResponse(response, verification.retryAfterSeconds);
        return;
      }
      if (!verification.ok) {
        recordRateLimitFailure("verification-attempt-ip", clientIp, RATE_LIMIT_POLICIES.verificationAttemptIp);
        sendJson(response, 401, { ok: false, error: "invalid-or-expired-code" });
        return;
      }
      clearRateLimit("verification-attempt-ip", clientIp);
      sendJson(response, 200, {
        ok: true,
        emailVerified: true,
        verifiedAt: verification.verifiedAt,
      });
    } catch (error) {
      if (!sendJsonRequestError(response, error, "invalid-verification-request")) {
        sendJson(response, 400, { ok: false, error: "invalid-verification-request" });
      }
    }
    return;
  }

  if (requestUrl.pathname === "/api/auth/users") {
    if (request.method !== "POST") {
      sendMethodNotAllowed(response, ["POST"]);
      return;
    }
    const developerSession = requireDeveloperSession(request, response);
    if (!developerSession) {
      return;
    }
    if (!hasLegacyMutationProof(request)) {
      sendJson(response, 403, { ok: false, error: "request-not-authorized" });
      return;
    }
    try {
      const payload = await readJsonRequest(request, JSON_BODY_LIMITS.managedUser);
      if (!payload || typeof payload !== "object" || !payload.user) {
        sendJson(response, 400, { error: "invalid-payload" });
        return;
      }
      const result = await upsertSharedAuthUser(payload.user, payload.accessControl, developerSession.session);
      sendJson(response, 200, {
        ok: true,
        updatedAt: result.nextState.updatedAt || new Date().toISOString(),
        user: result.user,
      });
    } catch (error) {
      if (sendJsonRequestError(response, error, "invalid-auth-user-request")) {
        return;
      }
      const code = String(error?.message || "");
      const statusCode = code === "developer-role-managed-by-server" || code === "invalid-managed-user-role" ? 403 : 400;
      sendJson(response, statusCode, {
        ok: false,
        error: code === "developer-role-managed-by-server" || code === "invalid-managed-user-role"
          ? "role-not-authorized"
          : "auth-user-save-failed",
      });
    }
    return;
  }

  if (requestUrl.pathname === "/api/shared-state") {
    if (request.method === "GET") {
      if (!requireDeveloperSession(request, response)) {
        return;
      }
      try {
        sendJson(response, 200, await readSharedStateBackend());
      } catch (error) {
        sendJson(response, 500, {
          error: "shared-state-read-failed",
        });
      }
      return;
    }

    if (request.method === "PUT") {
      if (!requireDeveloperSession(request, response)) {
        return;
      }
      if (!hasLegacyMutationProof(request)) {
        sendJson(response, 403, { ok: false, error: "request-not-authorized" });
        return;
      }
      try {
        const payload = await readJsonRequest(request, JSON_BODY_LIMITS.sharedState);
        if (!payload || typeof payload !== "object") {
          sendJson(response, 400, { error: "invalid-payload" });
          return;
        }
        const nextState = await writeSharedStateBackend(payload);
        sendJson(response, 200, nextState);
      } catch (error) {
        if (sendJsonRequestError(response, error, "invalid-shared-state-request")) {
          return;
        }
        sendJson(response, 400, {
          error: "shared-state-write-failed",
        });
      }
      return;
    }

    sendMethodNotAllowed(response, ["GET", "PUT"]);
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendMethodNotAllowed(response, ["GET", "HEAD"], "text");
    return;
  }

  serveAppFile(rawRequestPath, response, request.method);
}

const server = http.createServer((request, response) => {
  Promise.resolve(handleRequest(request, response)).catch(() => {
    // Keep unexpected failures opaque to callers. Route handlers already return
    // precise public errors for expected validation failures.
    if (!response.headersSent) {
      sendJson(response, 500, { ok: false, error: "internal-error" });
      return;
    }
    response.destroy();
  });
});

module.exports = handleRequest;
module.exports.server = server;

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    ensureDataFile();
    console.log(`GrafiCalc local integration server on http://localhost:${PORT}`);
  });
}
