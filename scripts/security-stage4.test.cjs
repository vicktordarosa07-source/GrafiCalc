const assert = require("assert");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const tempDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-stage4-"));

function listen(server) {
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server.address().port)));
}

function request({ port, method = "GET", pathname, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const payload = body ? Buffer.from(body) : null;
    const requestHeaders = { ...headers };
    if (payload) {
      requestHeaders["Content-Length"] = payload.length;
    }
    const request = http.request({
      host: "127.0.0.1",
      port,
      method,
      path: pathname,
      headers: requestHeaders,
      timeout: 5000,
    }, (response) => {
      let raw = "";
      response.on("data", (chunk) => { raw += chunk; });
      response.on("end", () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: raw,
      }));
    });
    request.on("timeout", () => request.destroy(new Error("request-timeout")));
    request.on("error", reject);
    if (payload) {
      request.write(payload);
    }
    request.end();
  });
}

function waitForReady(port, child) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("legacy-server-did-not-start")), 6000);
    const interval = setInterval(async () => {
      try {
        const result = await request({ port, pathname: "/api/health" });
        if (result.status === 200) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        }
      } catch {
        // The process may still be binding its port.
      }
    }, 80);
    child.once("exit", (code) => {
      clearInterval(interval);
      clearTimeout(timeout);
      reject(new Error(`legacy-server-exited-${code}`));
    });
  });
}

async function main() {
  let tenant = null;
  let tenantCreates = 0;
  let state = null;
  const expectedServiceKey = "stage4-test-service-role";
  const fakeSupabase = http.createServer((request, response) => {
    assert.strictEqual(request.headers.apikey, expectedServiceKey);
    assert.strictEqual(request.headers.authorization, `Bearer ${expectedServiceKey}`);
    const url = new URL(request.url, "http://127.0.0.1");
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", () => {
      const json = (value) => {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(value));
      };
      if (url.pathname === "/rest/v1/graficalc_tenants" && request.method === "GET") {
        json(tenant ? [tenant] : []);
        return;
      }
      if (url.pathname === "/rest/v1/graficalc_tenants" && request.method === "POST") {
        tenantCreates += 1;
        tenant ||= { id: "tenant-stage4", slug: "stage4-tenant", name: "GrafiCalc Workspace" };
        json([tenant]);
        return;
      }
      if (url.pathname === "/rest/v1/graficalc_runtime_state" && request.method === "GET") {
        json(state ? [{ payload: state, updated_at: "2026-08-17T00:00:00.000Z" }] : []);
        return;
      }
      if (url.pathname === "/rest/v1/graficalc_runtime_state" && request.method === "POST") {
        const payload = JSON.parse(raw || "{}");
        assert.strictEqual(payload.tenant_id, "tenant-stage4");
        state = payload.payload;
        json([{ payload: state, updated_at: "2026-08-17T00:00:00.000Z" }]);
        return;
      }
      response.writeHead(404).end();
    });
  });
  const supabasePort = await listen(fakeSupabase);
  const reservation = http.createServer();
  const appPort = await listen(reservation);
  // Free the reserved port immediately before spawning the isolated server.
  await new Promise((resolve) => reservation.close(resolve));

  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(appPort),
      HOST: "127.0.0.1",
      NODE_ENV: "test",
      GRAFICALC_DATA_DIR: tempDataDir,
      GRAFICALC_SESSION_SECRET: "stage4-session-secret-only-for-tests",
      GRAFICALC_DEVELOPER_USERNAME: "security-admin",
      GRAFICALC_DEVELOPER_PASSWORD: "Strong#Stage4Password",
      SUPABASE_URL: `http://127.0.0.1:${supabasePort}`,
      SUPABASE_SERVICE_ROLE_KEY: expectedServiceKey,
      GRAFICALC_TENANT_SLUG: "stage4-tenant",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForReady(appPort, child);
    const userPayload = JSON.stringify({ user: { id: "user-1", email: "employee@example.com", role: "employee", password: "not-returned" } });
    assert.strictEqual((await request({ port: appPort, pathname: "/api/shared-state" })).status, 401);
    assert.strictEqual((await request({
      port: appPort,
      pathname: "/api/shared-state",
      headers: { Cookie: "graficalc_session=forged-session" },
    })).status, 401);
    assert.strictEqual((await request({
      port: appPort,
      method: "POST",
      pathname: "/api/auth/users",
      headers: { "Content-Type": "application/json", "X-GrafiCalc-Request": "1" },
      body: userPayload,
    })).status, 401);

    const login = await request({
      port: appPort,
      method: "POST",
      pathname: "/api/auth/developer-login",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "security-admin", password: "Strong#Stage4Password" }),
    });
    assert.strictEqual(login.status, 200);
    const cookie = login.headers["set-cookie"][0].split(";")[0];
    const adminHeaders = { Cookie: cookie, "X-GrafiCalc-Request": "1", "Content-Type": "application/json" };

    const crossOrigin = await request({
      port: appPort,
      method: "POST",
      pathname: "/api/auth/users",
      headers: { ...adminHeaders, Origin: "https://attacker.example" },
      body: userPayload,
    });
    assert.strictEqual(crossOrigin.status, 403);

    const privilegedPayload = JSON.stringify({ user: { id: "user-2", email: "attacker@example.com", role: "developer" } });
    const privilegeEscalation = await request({
      port: appPort,
      method: "POST",
      pathname: "/api/auth/users",
      headers: adminHeaders,
      body: privilegedPayload,
    });
    assert.strictEqual(privilegeEscalation.status, 403);

    const saved = await request({
      port: appPort,
      method: "POST",
      pathname: "/api/auth/users",
      headers: adminHeaders,
      body: userPayload,
    });
    assert.strictEqual(saved.status, 200);
    assert.ok(!Object.prototype.hasOwnProperty.call(JSON.parse(saved.body).user, "password"));

    const stateReadResults = await Promise.all(Array.from({ length: 5 }, () => request({
      port: appPort,
      pathname: "/api/shared-state",
      headers: { Cookie: cookie },
    })));
    stateReadResults.forEach((result) => assert.strictEqual(result.status, 200));
    assert.strictEqual(tenantCreates, 1);

    const write = await request({
      port: appPort,
      method: "PUT",
      pathname: "/api/shared-state",
      headers: adminHeaders,
      body: JSON.stringify({ tenantId: "attacker-controlled-tenant", clients: [{ id: "safe" }] }),
    });
    assert.strictEqual(write.status, 200);
    assert.strictEqual(tenant.slug, "stage4-tenant");
    process.stdout.write("stage4-security-tests: passed\n");
  } finally {
    child.kill();
    await new Promise((resolve) => fakeSupabase.close(resolve));
  }
}

main().catch((error) => {
  process.stderr.write(`stage4-security-tests: failed: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
