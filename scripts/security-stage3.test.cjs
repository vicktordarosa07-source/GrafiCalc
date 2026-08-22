const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..");
const PORT = 3917;
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-security-stage3-"));
const developerPassword = "Correct#123";
const configPassword = "Config#123";
const sessionSecret = "stage3-test-session-secret";
let server;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(method, requestPath, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: "127.0.0.1",
      port: PORT,
      method,
      path: requestPath,
      headers: {
        ...(payload ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } : {}),
        ...headers,
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
    req.end(payload);
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await request("GET", "/api/auth/session");
      if (response.status === 200) return;
    } catch (error) {
      lastError = error;
    }
    await wait(100);
  }
  throw lastError || new Error("server did not start");
}

function getLatestOutboxCode(email) {
  const outbox = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "email-outbox.local.json"), "utf8"));
  const entries = Array.isArray(outbox.sent) ? outbox.sent : [];
  const entry = entries.find((item) => item.to === email);
  assert.ok(entry, `outbox entry missing for ${email}`);
  assert.match(String(entry.code || ""), /^\d{6}$/, `verification code missing for ${email}`);
  return entry.code;
}

async function sendVerification(email) {
  return request("POST", "/api/auth/send-verification-code", { email, username: "Teste" });
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
      GRAFICALC_SECURITY_TEST_WINDOW_MS: "1000",
      GRAFICALC_VERIFICATION_CODE_TTL_MS: "1000",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => logs.push(chunk.toString()));
  server.stderr.on("data", (chunk) => logs.push(chunk.toString()));
  await waitForServer();

  const validLogin = await request("POST", "/api/auth/developer-login", {
    username: "developer-test",
    password: developerPassword,
  });
  assert.equal(validLogin.status, 200);
  assert.match(String(validLogin.headers["set-cookie"]), /HttpOnly/i);
  const cookie = String(validLogin.headers["set-cookie"]).split(";")[0];

  const validUnlock = await request("POST", "/api/config/unlock", { password: configPassword }, { Cookie: cookie });
  assert.equal(validUnlock.status, 200);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request("POST", "/api/auth/developer-login", {
      username: "developer-test",
      password: "wrong-password",
    });
    assert.equal(response.status, 401);
    assert.equal(response.json?.error, "invalid-credentials");
  }
  const loginBlocked = await request("POST", "/api/auth/developer-login", {
    username: "developer-test",
    password: "wrong-password",
  });
  assert.equal(loginBlocked.status, 429);
  assert.ok(Number(loginBlocked.headers["retry-after"]) >= 1);
  await wait(1100);
  assert.equal((await request("POST", "/api/auth/developer-login", {
    username: "developer-test",
    password: developerPassword,
  })).status, 200);

  // Default trust-proxy is disabled: forged forwarded IPs must not evade the
  // socket-IP limiter when each request uses a different username.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await request("POST", "/api/auth/developer-login", {
      username: `spoofed-${attempt}`,
      password: "wrong-password",
    }, { "X-Forwarded-For": `203.0.113.${attempt + 1}` })).status, 401);
  }
  assert.equal((await request("POST", "/api/auth/developer-login", {
    username: "spoofed-final",
    password: "wrong-password",
  }, { "X-Forwarded-For": "198.51.100.10" })).status, 429);
  await wait(1100);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request("POST", "/api/config/unlock", { password: "wrong-password" }, { Cookie: cookie });
    assert.equal(response.status, 403);
    assert.equal(response.json?.error, "config-unlock-denied");
  }
  const unlockBlocked = await request("POST", "/api/config/unlock", { password: "wrong-password" }, { Cookie: cookie });
  assert.equal(unlockBlocked.status, 429);
  await wait(1100);
  assert.equal((await request("POST", "/api/config/unlock", { password: configPassword }, { Cookie: cookie })).status, 200);

  const bruteForceEmail = "bruteforce@example.test";
  const firstDelivery = await sendVerification(bruteForceEmail);
  assert.equal(firstDelivery.status, 200);
  const bruteForceCode = getLatestOutboxCode(bruteForceEmail);
  assert.doesNotMatch(firstDelivery.raw, new RegExp(bruteForceCode));
  const immediateResend = await sendVerification(bruteForceEmail);
  assert.equal(immediateResend.status, 429);
  assert.ok(Number(immediateResend.headers["retry-after"]) >= 1);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await request("POST", "/api/auth/verify-verification-code", {
      email: bruteForceEmail,
      code: "000000",
    })).status, 401);
  }
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: bruteForceEmail,
    code: bruteForceCode,
  })).status, 429);

  const successEmail = "success@example.test";
  assert.equal((await sendVerification(successEmail)).status, 200);
  const successCode = getLatestOutboxCode(successEmail);
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: successEmail,
    code: successCode,
  })).status, 200);
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: successEmail,
    code: successCode,
  })).status, 401);

  const replaceEmail = "replace@example.test";
  assert.equal((await sendVerification(replaceEmail)).status, 200);
  const replacedCode = getLatestOutboxCode(replaceEmail);
  await wait(1100);
  assert.equal((await sendVerification(replaceEmail)).status, 200);
  const currentCode = getLatestOutboxCode(replaceEmail);
  assert.notEqual(currentCode, replacedCode);
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: replaceEmail,
    code: replacedCode,
  })).status, 401);
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: replaceEmail,
    code: currentCode,
  })).status, 200);

  const expiredEmail = "expired@example.test";
  assert.equal((await sendVerification(expiredEmail)).status, 200);
  const expiredCode = getLatestOutboxCode(expiredEmail);
  await wait(1100);
  assert.equal((await request("POST", "/api/auth/verify-verification-code", {
    email: expiredEmail,
    code: expiredCode,
  })).status, 401);

  for (let attempt = 0; attempt < 20; attempt += 1) {
    assert.equal((await sendVerification(`ip-limit-${attempt}@example.test`)).status, 200);
  }
  const emailIpBlocked = await sendVerification("ip-limit-blocked@example.test");
  assert.equal(emailIpBlocked.status, 429);

  await wait(1100);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    assert.equal((await request("POST", "/api/auth/verify-verification-code", {
      email: `unknown-${attempt}@example.test`,
      code: "000000",
    })).status, 401);
  }
  const codeIpBlocked = await request("POST", "/api/auth/verify-verification-code", {
    email: "unknown-blocked@example.test",
    code: "000000",
  });
  assert.equal(codeIpBlocked.status, 429);

  const logText = logs.join("");
  for (const secret of [developerPassword, configPassword, sessionSecret]) {
    assert.ok(!logText.includes(secret), "server logs exposed a test secret");
  }
  console.log("Stage 3 security checks passed.");
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
