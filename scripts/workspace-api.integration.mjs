import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const baseUrl = "http://127.0.0.1:3217";
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const password = `Test-${randomBytes(28).toString("base64url")}!7`;
const suffix = `${Date.now()}-${randomBytes(4).toString("hex")}`;
const users = [];
const insertedTenants = new Set();
let server;

function accountClient() {
  const jar = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: true },
    cookies: {
      getAll: () => Array.from(jar, ([name, value]) => ({ name, value })),
      setAll: (values) => values.forEach(({ name, value, options }) => options?.maxAge === 0 ? jar.delete(name) : jar.set(name, value)),
    },
  });
  return {
    client,
    cookie: () => Array.from(jar, ([name, value]) => `${name}=${value}`).join("; "),
    absorb: (response) => {
      for (const value of response.headers.getSetCookie()) {
        const [pair] = value.split(";", 1);
        const index = pair.indexOf("=");
        if (index < 0) continue;
        const name = pair.slice(0, index), cookieValue = pair.slice(index + 1);
        if (!cookieValue || /max-age=0/i.test(value)) jar.delete(name);
        else jar.set(name, cookieValue);
      }
    },
  };
}

async function api(account, path, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Cookie: account.cookie(), ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  account.absorb(response);
  return { response, json: await response.json() };
}

async function createAccount(label) {
  const email = `codex-isolation-${label}-${suffix}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nome: `Temporary ${label}` } });
  if (error) throw error;
  users.push(data.user.id);
  const session = accountClient();
  const signed = await session.client.auth.signInWithPassword({ email, password });
  if (signed.error) throw signed.error;
  return session;
}

try {
  const entry = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3217"], {
    cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "ignore", "pipe"],
    env: { ...process.env, GRAFICALC_SESSION_SECRET: randomBytes(48).toString("base64url"), GRAFICALC_TENANT_SLUG: "", NODE_USE_SYSTEM_CA: "1" },
  });
  server = entry;
  let serverError = "";
  entry.stderr.on("data", (chunk) => { serverError = `${serverError}${chunk}`.slice(-4000); });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (entry.exitCode !== null) throw new Error(`Next start exited early: ${serverError}`);
    try { const response = await fetch(`${baseUrl}/entrar`); if (response.ok) { ready = true; break; } } catch { /* Server is starting. */ }
    await delay(750);
  }
  assert.ok(ready, `Next start did not become ready: ${serverError}`);

  const [owner, separate] = await Promise.all([createAccount("owner"), createAccount("separate")]);
  const [ownerContext, separateContext] = await Promise.all([api(owner, "/api/config/pin/context"), api(separate, "/api/config/pin/context")]);
  assert.equal(ownerContext.response.status, 200);
  assert.equal(separateContext.response.status, 200);
  const ownerIdentity = { "X-GrafiCalc-User": ownerContext.json.userId, "X-GrafiCalc-Tenant": ownerContext.json.tenantId };
  const separateIdentity = { "X-GrafiCalc-User": separateContext.json.userId, "X-GrafiCalc-Tenant": separateContext.json.tenantId };
  insertedTenants.add(ownerContext.json.tenantId);
  insertedTenants.add(separateContext.json.tenantId);
  assert.notEqual(ownerContext.json.tenantId, separateContext.json.tenantId);
  const memberProfiles = await separate.client.from("profiles").select("id");
  assert.equal(memberProfiles.error, null);
  assert.deepEqual(memberProfiles.data.map((profile) => profile.id), [separateContext.json.userId]);
  const privilegeEscalation = await separate.client.from("profiles").update({ tenant_id: ownerContext.json.tenantId, papel: "admin" }).eq("id", separateContext.json.userId);
  assert.ok(privilegeEscalation.error);

  const saved = await api(owner, "/api/shared-state", { method: "PUT", headers: ownerIdentity, body: {
    baseUpdatedAt: null, sharedState: { company: { name: "Temporary" }, clients: [{ id: "private-owner-client", name: "Private A" }], quoteHistory: [{ id: "private-owner-quote" }], workOrders: [] },
  } });
  assert.equal(saved.response.status, 200, JSON.stringify(saved.json));

  const isolated = await api(separate, "/api/shared-state", { headers: separateIdentity });
  assert.equal(isolated.response.status, 200, `isolated workspace read: ${isolated.response.status} ${JSON.stringify(isolated.json)}`);
  assert.equal(isolated.json.payload.sharedState?.clients?.length || 0, 0);
  assert.equal(isolated.json.payload.sharedState?.quoteHistory?.length || 0, 0);
  const spoofed = await api(owner, "/api/shared-state", { headers: separateIdentity });
  assert.equal(spoofed.response.status, 409);

  const pin = await api(owner, "/api/config/pin/change", { method: "POST", headers: ownerIdentity, body: { currentPin: "", newPin: "4831", confirmPin: "4831" } });
  assert.equal(pin.response.status, 200, JSON.stringify(pin.json));
  const afterPin = await api(owner, "/api/shared-state", { headers: ownerIdentity });
  assert.equal(afterPin.json.payload.config.security.configAccess.pinHash, undefined);
  const noPin = await api(owner, "/api/shared-state", { method: "PUT", headers: ownerIdentity, body: {
    baseUpdatedAt: afterPin.json.updatedAt, publishConfig: true, config: { prices: { privateRate: 100 } },
    sharedState: { clients: [], quoteHistory: [], workOrders: [] },
  } });
  assert.equal(noPin.response.status, 403);
  const verified = await api(owner, "/api/config/pin/verify", { method: "POST", headers: ownerIdentity, body: { pin: "4831" } });
  assert.equal(verified.response.status, 200, JSON.stringify(verified.json));
  const publish = await api(owner, "/api/shared-state", { method: "PUT", headers: ownerIdentity, body: {
    baseUpdatedAt: verified.json.updatedAt, publishConfig: true, config: { prices: { privateRate: 20 } },
    sharedState: { clients: [{ id: "private-owner-client", name: "Private A" }], quoteHistory: [{ id: "private-owner-quote" }], workOrders: [] },
  } });
  assert.equal(publish.response.status, 200, JSON.stringify(publish.json));
  assert.equal(publish.json.payload.config.prices.privateRate, 20);
  assert.equal(publish.json.payload.sharedState.clients[0].id, "private-owner-client");
  const replay = await api(owner, "/api/shared-state", { method: "PUT", headers: ownerIdentity, body: {
    baseUpdatedAt: verified.json.updatedAt, publishConfig: true, config: { prices: { privateRate: 999 } },
    sharedState: { clients: [{ id: "private-owner-client", name: "Private A" }], quoteHistory: [{ id: "private-owner-quote" }], workOrders: [] },
  } });
  assert.equal(replay.response.status, 409);

  const grant = await admin.from("profiles").update({ tenant_id: ownerContext.json.tenantId, papel: "funcionario" }).eq("id", separateContext.json.userId);
  if (grant.error) throw grant.error;
  const joined = await api(separate, "/api/config/pin/context");
  const memberIdentity = { "X-GrafiCalc-User": joined.json.userId, "X-GrafiCalc-Tenant": joined.json.tenantId };
  assert.equal(joined.json.tenantId, ownerContext.json.tenantId);
  assert.equal(joined.json.permissions.edit, false);
  const teamView = await api(separate, "/api/shared-state", { headers: memberIdentity });
  assert.equal(teamView.json.payload.sharedState.clients[0].id, "private-owner-client");
  assert.ok(!JSON.stringify(teamView.json).includes("pinHash"));
  console.log("workspace-api: RLS, isolated tenant reads/writes, spoofed identity rejection, PIN-gated config publish, one-use PIN verification, secret redaction, and team sharing passed");
} finally {
  if (server && server.exitCode === null) { server.kill(); await Promise.race([new Promise((resolve) => server.once("exit", resolve)), delay(8000)]); }
  for (const id of users) await admin.auth.admin.deleteUser(id);
  for (const tenantId of insertedTenants) {
    await admin.from("graficalc_runtime_state").delete().eq("tenant_id", tenantId);
    await admin.from("graficalc_tenants").delete().eq("id", tenantId);
  }
}
