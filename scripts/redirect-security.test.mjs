import assert from "node:assert/strict";
import { safeInternalRedirect } from "../lib/security/redirects.ts";

assert.equal(safeInternalRedirect("/workspace"), "/workspace");
assert.equal(safeInternalRedirect("/alterar-senha?from=recovery"), "/alterar-senha?from=recovery");
assert.equal(safeInternalRedirect("/perfil#seguranca"), "/perfil#seguranca");
assert.equal(safeInternalRedirect(""), "/workspace");
assert.equal(safeInternalRedirect("https://evil.example"), "/workspace");
assert.equal(safeInternalRedirect("//evil.example"), "/workspace");
assert.equal(safeInternalRedirect("///evil.example"), "/workspace");
assert.equal(safeInternalRedirect("/\\\\evil.example"), "/workspace");
assert.equal(safeInternalRedirect("/\\evil.example/path"), "/workspace");
assert.equal(safeInternalRedirect("/\nevil"), "/workspace");
assert.equal(safeInternalRedirect("/%5C%5Cevil.example"), "/%5C%5Cevil.example");

console.log("redirect-security: internal redirects are preserved and external/backslash variants rejected");
