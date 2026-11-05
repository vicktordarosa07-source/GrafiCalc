import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { isStrongSecret } = require("../lib/security/secret-strength.cjs");

test("session secrets require long, diverse printable values", () => {
  assert.equal(isStrongSecret("F4kQ9vT2mR7xB3pL8zN6cH1sW5yD0aGH"), true);
  assert.equal(isStrongSecret("short"), false);
  assert.equal(isStrongSecret("A".repeat(40)), false);
  assert.equal(isStrongSecret("12345678!QWERTYuiopASDFghjkl"), false);
  assert.equal(isStrongSecret("contains space and is otherwise long enough"), false);
});

test("legacy deployed server fails closed with a weak session secret", () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = spawnSync(process.execPath, ["server.js"], {
    cwd: root,
    encoding: "utf8",
    timeout: 5000,
    env: { ...process.env, NODE_ENV: "production", VERCEL: "1", GRAFICALC_SESSION_SECRET: "too-short" },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /GRAFICALC_SESSION_SECRET must be a strong random secret/);
});
