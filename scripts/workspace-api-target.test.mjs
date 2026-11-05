import assert from "node:assert/strict";
import test from "node:test";
import { assertWorkspaceApiSandboxTarget } from "./workspace-api-target.mjs";

const sandboxRef = "bhrzlswkfcijjmixjbuo";
const valid = {
  url: `https://${sandboxRef}.supabase.co`,
  expectedProjectRef: sandboxRef,
  secretKey: "sb_secret_sandbox_only",
  publishableKey: "sb_publishable_sandbox_only",
};

test("accepts the explicitly configured Sandbox project", () => {
  assert.equal(assertWorkspaceApiSandboxTarget(valid), sandboxRef);
});

test("refuses the known production project even when explicitly configured", () => {
  assert.throws(() => assertWorkspaceApiSandboxTarget({
    ...valid,
    url: "https://zneombmzsnslpqhggsph.supabase.co",
    expectedProjectRef: "zneombmzsnslpqhggsph",
  }), /refuse the GrafiCalc production project/);
});

test("refuses a URL that does not match the explicit Sandbox ref", () => {
  assert.throws(() => assertWorkspaceApiSandboxTarget({
    ...valid,
    url: "https://zneombmzsnslpqhggsph.supabase.co",
  }), /must match GRAFICALC_TEST_SUPABASE_PROJECT_REF exactly/);
});

test("refuses non-HTTPS or credential-bearing URLs", () => {
  assert.throws(() => assertWorkspaceApiSandboxTarget({ ...valid, url: `http://${sandboxRef}.supabase.co` }), /must match/);
  assert.throws(() => assertWorkspaceApiSandboxTarget({ ...valid, url: `https://user:pass@${sandboxRef}.supabase.co` }), /must match/);
  assert.throws(() => assertWorkspaceApiSandboxTarget({ ...valid, url: `https://${sandboxRef}.supabase.co/path` }), /must match/);
});

test("requires separate server-only and publishable keys", () => {
  assert.throws(() => assertWorkspaceApiSandboxTarget({ ...valid, secretKey: "" }), /secret key and publishable key/);
  assert.throws(() => assertWorkspaceApiSandboxTarget({ ...valid, secretKey: valid.publishableKey }), /secret key and publishable key/);
});
