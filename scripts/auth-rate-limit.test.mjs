import assert from "node:assert/strict";
import test from "node:test";
import { beginAuthAttempt } from "../lib/supabase/auth-rate-limit.ts";

function client(responses) {
  const calls = [];
  return {
    calls,
    rpc(name, args) {
      calls.push([name, args]);
      const response = responses.shift();
      if (!response) throw new Error(`Unexpected RPC: ${name}`);
      return Promise.resolve(response);
    },
  };
}

test("uses atomic reservation when migration 08 is present", async () => {
  const rpc = client([{ data: true, error: null }]);
  assert.equal(await beginAuthAttempt(rpc, "ip:user"), true);
  assert.deepEqual(rpc.calls.map(([name]) => name), ["graficalc_begin_auth_attempt"]);
});

test("uses existing legacy RPCs if the atomic function is not deployed yet", async () => {
  const rpc = client([
    { data: null, error: { code: "PGRST202", message: "Could not find the function public.graficalc_begin_auth_attempt" } },
    { data: true, error: null },
    { data: null, error: null },
  ]);
  assert.equal(await beginAuthAttempt(rpc, "ip:user"), true);
  assert.deepEqual(rpc.calls.map(([name]) => name), [
    "graficalc_begin_auth_attempt",
    "graficalc_auth_attempt_allowed",
    "graficalc_record_auth_failure",
  ]);
});

test("does not record an attempt if the legacy limiter already blocks it", async () => {
  const rpc = client([
    { data: null, error: { code: "PGRST202", message: "Could not find the function public.graficalc_begin_auth_attempt" } },
    { data: false, error: null },
  ]);
  assert.equal(await beginAuthAttempt(rpc, "ip:user"), false);
  assert.equal(rpc.calls.length, 2);
});

test("fails closed for unexpected atomic RPC errors", async () => {
  const rpc = client([{ data: null, error: { code: "42501", message: "permission denied" } }]);
  await assert.rejects(beginAuthAttempt(rpc, "ip:user"), /rate limit is unavailable/i);
  assert.equal(rpc.calls.length, 1);
});

test("fails closed if the legacy limiter cannot reserve the attempt", async () => {
  const rpc = client([
    { data: null, error: { code: "PGRST202", message: "Could not find the function public.graficalc_begin_auth_attempt" } },
    { data: true, error: null },
    { data: null, error: { code: "42501", message: "permission denied" } },
  ]);
  await assert.rejects(beginAuthAttempt(rpc, "ip:user"), /rate limit is unavailable/i);
});
