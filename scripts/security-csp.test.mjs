import assert from "node:assert/strict";
import { createContentSecurityPolicy, createLegacyContentSecurityPolicy } from "../lib/security/csp.ts";

const nonce = "dGVzdC1ub25jZS0xMjM=";
const productionPolicy = createContentSecurityPolicy(nonce);

assert.match(productionPolicy, new RegExp(`'nonce-${nonce.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'`));
assert.match(productionPolicy, /'strict-dynamic'/);
assert.match(productionPolicy, /https:\/\/challenges\.cloudflare\.com/);
const productionScriptPolicy = productionPolicy.split("; ").find((directive) => directive.startsWith("script-src "));
assert.doesNotMatch(productionScriptPolicy, /unsafe-inline|unsafe-eval/);
assert.doesNotMatch(productionPolicy, /unsafe-inline/);
assert.match(productionPolicy, /style-src[^;]*'unsafe-hashes' 'sha256-zlqnbDt84zf1iSefLU\/ImC54isoprH\/MRiVZGskwexk='/, "only Next Image's fixed fallback style attribute should be allowed");

const developmentPolicy = createContentSecurityPolicy(nonce, true);
const developmentScriptPolicy = developmentPolicy.split("; ").find((directive) => directive.startsWith("script-src "));
assert.match(developmentScriptPolicy, /'unsafe-eval'/);
assert.doesNotMatch(developmentScriptPolicy, /unsafe-inline/);
assert.doesNotMatch(developmentPolicy, /unsafe-inline/);

const legacyPolicy = createLegacyContentSecurityPolicy(nonce);
const legacyScriptPolicy = legacyPolicy.split("; ").find((directive) => directive.startsWith("script-src "));
assert.equal(legacyScriptPolicy, "script-src 'self' https://challenges.cloudflare.com");
assert.doesNotMatch(legacyScriptPolicy, /nonce-|strict-dynamic|unsafe-inline/);
assert.match(legacyPolicy, new RegExp(`style-src 'self' 'nonce-${nonce}`));

console.log("security-csp: strict app policy and same-origin legacy script policy verified");
