const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

function reservePort() {
  return new Promise((resolve, reject) => {
    const reservation = http.createServer();
    reservation.once("error", reject);
    reservation.listen(0, "127.0.0.1", () => {
      const port = reservation.address().port;
      reservation.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function request(port, method, requestPath, headers = {}) {
  return new Promise((resolve, reject) => {
    const requestInstance = http.request({
      host: "127.0.0.1",
      port,
      method,
      path: requestPath,
      headers,
      timeout: 5000,
    }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    requestInstance.on("timeout", () => requestInstance.destroy(new Error("request-timeout")));
    requestInstance.on("error", reject);
    requestInstance.end();
  });
}

async function startServer(environment = {}) {
  const port = await reservePort();
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "graficalc-stage-final-"));
  const child = spawn(process.execPath, ["server.js"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      GRAFICALC_DATA_DIR: dataDirectory,
      GRAFICALC_SESSION_SECRET: "stage-final-session-secret-only-for-tests",
      GRAFICALC_DEVELOPER_USERNAME: "stage-final-admin",
      GRAFICALC_DEVELOPER_PASSWORD: "StageFinal#123",
      ...environment,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await request(port, "GET", "/api/health");
      if (response.status === 200) {
        return { child, port, dataDirectory };
      }
    } catch {
      // The server may still be binding its local port.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  child.kill();
  fs.rmSync(dataDirectory, { recursive: true, force: true });
  throw new Error("legacy-server-did-not-start");
}

async function stopServer(instance) {
  if (!instance) return;
  instance.child.kill();
  await new Promise((resolve) => instance.child.once("exit", resolve));
  fs.rmSync(instance.dataDirectory, { recursive: true, force: true });
}

async function main() {
  let localServer;
  let productionServer;
  try {
    localServer = await startServer({ NODE_ENV: "test" });

    const health = await request(localServer.port, "GET", "/api/health", { Origin: "https://attacker.example" });
    assert.equal(health.status, 200);
    assert.deepEqual(JSON.parse(health.body), { ok: true });
    assert.equal(health.headers["cache-control"], "no-store");
    assert.equal(health.headers["x-content-type-options"], "nosniff");
    assert.equal(health.headers["x-frame-options"], "DENY");
    assert.equal(health.headers["referrer-policy"], "strict-origin-when-cross-origin");
    assert.equal(health.headers["access-control-allow-origin"], undefined);
    assert.equal(health.headers["strict-transport-security"], undefined);
    assert.match(String(health.headers["content-security-policy"]), /default-src 'self'/);
    assert.match(String(health.headers["content-security-policy"]), /frame-ancestors 'none'/);
    assert.match(String(health.headers["content-security-policy"]), /script-src 'self'/);
    assert.doesNotMatch(String(health.headers["content-security-policy"]), /unsafe-eval/);

    const healthWrongMethod = await request(localServer.port, "POST", "/api/health");
    assert.equal(healthWrongMethod.status, 405);
    assert.equal(healthWrongMethod.headers.allow, "GET");
    assert.equal(JSON.parse(healthWrongMethod.body).error, "method-not-allowed");

    const sessionWrongMethod = await request(localServer.port, "POST", "/api/auth/session");
    assert.equal(sessionWrongMethod.status, 405);
    assert.equal(sessionWrongMethod.headers.allow, "GET");

    const documentResponse = await request(localServer.port, "GET", "/index.html");
    assert.equal(documentResponse.status, 200);
    assert.match(String(documentResponse.headers["content-type"]), /^text\/html/);
    assert.equal(documentResponse.headers["cache-control"], "no-cache");
    assert.match(documentResponse.body, /GrafiCalc/);

    const stylesheetResponse = await request(localServer.port, "GET", "/styles.css");
    assert.equal(stylesheetResponse.status, 200);
    assert.match(String(stylesheetResponse.headers["content-type"]), /^text\/css/);
    assert.equal(stylesheetResponse.headers["cache-control"], "public, max-age=300, must-revalidate");

    const headResponse = await request(localServer.port, "HEAD", "/index.html");
    assert.equal(headResponse.status, 200);
    assert.equal(headResponse.body, "");

    const staticWrongMethod = await request(localServer.port, "POST", "/index.html");
    assert.equal(staticWrongMethod.status, 405);
    assert.equal(staticWrongMethod.headers.allow, "GET, HEAD");

    const unknownApi = await request(localServer.port, "GET", "/api/not-real");
    assert.equal(unknownApi.status, 404);
    assert.doesNotMatch(unknownApi.body, /server\.js|shared-state|supabase|tenant/i);

    productionServer = await startServer({ NODE_ENV: "production", VERCEL: "1" });
    const productionHealth = await request(productionServer.port, "GET", "/api/health");
    assert.equal(productionHealth.status, 200);
    assert.equal(productionHealth.headers["strict-transport-security"], "max-age=31536000");

    process.stdout.write("stage-final-security-tests: passed\n");
  } finally {
    await stopServer(productionServer);
    await stopServer(localServer);
  }
}

main().catch((error) => {
  process.stderr.write(`stage-final-security-tests: failed: ${error.stack || error.message}\n`);
  process.exitCode = 1;
});
