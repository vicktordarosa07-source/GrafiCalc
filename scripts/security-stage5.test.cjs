const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = 3919;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-security-stage5-"));
const developerPassword = "Correct#123";
const configPassword = "Config#123";
const sessionSecret = "stage5-test-session-secret";
let server;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(method, requestPath, options = {}) {
  const rawBody = options.rawBody === undefined
    ? (options.body === undefined ? "" : JSON.stringify(options.body))
    : options.rawBody;
  const bodyBuffer = Buffer.from(rawBody, "utf8");
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1",
      port: PORT,
      method,
      path: requestPath,
      headers: {
        ...(options.contentType ? { "Content-Type": options.contentType } : {}),
        ...(options.includeLength === false ? {} : { "Content-Length": String(bodyBuffer.length) }),
        ...(options.headers || {}),
      },
      timeout: 5000,
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => {
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
        resolve({ status: response.statusCode, headers: response.headers, raw, json });
      });
    });
    req.on("timeout", () => req.destroy(new Error("request timed out")));
    req.on("error", reject);
    req.end(bodyBuffer);
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await request("GET", "/api/health", { includeLength: false });
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await wait(100);
  }
  throw lastError || new Error("server did not start");
}

function getLatestOutboxEntry(email) {
  const outbox = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "email-outbox.local.json"), "utf8"));
  const entries = Array.isArray(outbox.sent) ? outbox.sent : [];
  const entry = entries.find((item) => item.to === email);
  assert.ok(entry, `outbox entry missing for ${email}`);
  return entry;
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await new Promise((resolve) => server.once("exit", resolve));
}

async function run() {
  const logs = [];
  server = spawn(process.execPath, ["server.js"], {
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      NODE_ENV: "test",
      GRAFICALC_DATA_DIR: DATA_DIR,
      GRAFICALC_EMAIL_MODE: "local-outbox",
      GRAFICALC_SESSION_SECRET: sessionSecret,
      GRAFICALC_DEVELOPER_USERNAME: "developer-test",
      GRAFICALC_DEVELOPER_PASSWORD: developerPassword,
      GRAFICALC_CONFIG_PASSWORD: configPassword,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  server.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  await waitForServer();

  assert.equal((await request("GET", "/api/health", { includeLength: false })).status, 200);

  const login = await request("POST", "/api/auth/developer-login", {
    contentType: "application/json; charset=utf-8",
    body: { username: "developer-test", password: developerPassword },
  });
  assert.equal(login.status, 200);
  const cookie = String(login.headers["set-cookie"]).split(";")[0];

  const wrongType = await request("POST", "/api/auth/developer-login", {
    contentType: "text/plain",
    rawBody: JSON.stringify({ username: "developer-test", password: developerPassword }),
  });
  assert.equal(wrongType.status, 415);
  assert.equal(wrongType.json?.error, "unsupported-media-type");

  const malformed = await request("POST", "/api/auth/developer-login", {
    contentType: "application/json",
    rawBody: "{\"username\":",
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.json?.error, "invalid-login-request");
  assert.equal((await request("GET", "/api/health", { includeLength: false })).status, 200);

  const empty = await request("POST", "/api/auth/developer-login", {
    contentType: "application/json",
    rawBody: "",
  });
  assert.equal(empty.status, 400);

  const oversized = await request("POST", "/api/auth/developer-login", {
    contentType: "application/json",
    rawBody: JSON.stringify({ username: "x", password: "a".repeat(20 * 1024) }),
  });
  assert.equal(oversized.status, 413);

  const invalidEmail = await request("POST", "/api/auth/send-verification-code", {
    contentType: "application/json",
    body: { email: "victim@example.test\r\nBcc: attacker@example.test" },
  });
  assert.equal(invalidEmail.status, 400);
  assert.equal(invalidEmail.json?.error, "invalid-email");

  const unicodeEmail = await request("POST", "/api/auth/send-verification-code", {
    contentType: "application/json",
    body: { email: "usuário@exemplo.com" },
  });
  assert.equal(unicodeEmail.status, 400);

  const longEmail = `${"a".repeat(245)}@example.test`;
  const tooLongEmail = await request("POST", "/api/auth/send-verification-code", {
    contentType: "application/json",
    body: { email: longEmail },
  });
  assert.equal(tooLongEmail.status, 400);

  const hostileEmail = "html-escape@example.test";
  const delivery = await request("POST", "/api/auth/send-verification-code", {
    contentType: "application/json",
    body: {
      email: hostileEmail,
      username: "<img src=x onerror=alert(1)>",
      company: "Empresa\r\nInjetada",
    },
  });
  assert.equal(delivery.status, 200);
  const outboxEntry = getLatestOutboxEntry(hostileEmail);
  assert.match(String(outboxEntry.code || ""), /^\d{6}$/);
  assert.doesNotMatch(String(outboxEntry.html || ""), /<img src=x/i);
  assert.match(String(outboxEntry.html || ""), /&lt;img src=x/i);
  assert.doesNotMatch(String(outboxEntry.company || ""), /\r|\n/);

  const invalidCodeType = await request("POST", "/api/auth/verify-verification-code", {
    contentType: "application/json",
    body: { email: hostileEmail, code: { unexpected: true } },
  });
  assert.equal(invalidCodeType.status, 401);

  const correctCode = await request("POST", "/api/auth/verify-verification-code", {
    contentType: "application/json",
    body: { email: hostileEmail, code: outboxEntry.code },
  });
  assert.equal(correctCode.status, 200);
  const reusedCode = await request("POST", "/api/auth/verify-verification-code", {
    contentType: "application/json",
    body: { email: hostileEmail, code: outboxEntry.code },
  });
  assert.equal(reusedCode.status, 401);

  const configWrongType = await request("POST", "/api/config/unlock", {
    contentType: "text/plain",
    rawBody: JSON.stringify({ password: configPassword }),
    headers: { Cookie: cookie },
  });
  assert.equal(configWrongType.status, 415);

  const sharedStateWrongType = await request("PUT", "/api/shared-state", {
    contentType: "text/plain",
    rawBody: "{}",
    headers: { Cookie: cookie, "X-GrafiCalc-Request": "1" },
  });
  assert.equal(sharedStateWrongType.status, 415);

  const managedUserWrongType = await request("POST", "/api/auth/users", {
    contentType: "text/plain",
    rawBody: "{}",
    headers: { Cookie: cookie, "X-GrafiCalc-Request": "1" },
  });
  assert.equal(managedUserWrongType.status, 415);

  const logout = await request("POST", "/api/auth/logout", {
    headers: { Cookie: cookie },
  });
  assert.equal(logout.status, 200);

  const logText = logs.join("");
  for (const secret of [developerPassword, configPassword, sessionSecret, outboxEntry.code]) {
    assert.ok(!logText.includes(secret), "server logs exposed sensitive test data");
  }
  console.log("Stage 5 security checks passed.");
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await stopServer();
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
  });
