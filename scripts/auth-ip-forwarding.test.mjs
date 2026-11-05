import assert from "node:assert/strict";
import test from "node:test";
import { getTrustedClientIp, resolveSupabaseAuthClientConfig } from "../lib/supabase/auth-ip-forwarding.ts";

test("extracts and validates the first forwarded client IP", () => {
  assert.equal(getTrustedClientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.2" })), "203.0.113.7");
  assert.equal(getTrustedClientIp(new Headers({ "x-forwarded-for": "2001:db8::1, 2001:db8::2" })), "2001:db8::1");
  assert.equal(getTrustedClientIp(new Headers({ "x-forwarded-for": "attacker.example, 10.0.0.2" })), null);
  assert.equal(getTrustedClientIp(new Headers()), null);
});

test("keeps public-key auth as the default", () => {
  assert.deepEqual(resolveSupabaseAuthClientConfig({
    forwardClientIp: false,
    clientIp: "203.0.113.7",
    publishableKey: " sb_publishable_test ",
    secretKey: "sb_secret_unused",
  }), { ok: true, apiKey: "sb_publishable_test" });
});

test("forwards client IP only with explicit enablement and a secret key", () => {
  assert.deepEqual(resolveSupabaseAuthClientConfig({
    forwardClientIp: true,
    clientIp: "203.0.113.7",
    publishableKey: "sb_publishable_test",
    secretKey: " sb_secret_test ",
  }), { ok: true, apiKey: "sb_secret_test", forwardedFor: "203.0.113.7" });
});

test("fails closed when forwarding is enabled without secret key or valid client IP", () => {
  assert.deepEqual(resolveSupabaseAuthClientConfig({
    forwardClientIp: true,
    clientIp: "203.0.113.7",
    publishableKey: "sb_publishable_test",
  }), { ok: false, reason: "secret-key-missing" });
  assert.deepEqual(resolveSupabaseAuthClientConfig({
    forwardClientIp: true,
    clientIp: "not-an-ip",
    secretKey: "sb_secret_test",
  }), { ok: false, reason: "client-ip-missing" });
});
