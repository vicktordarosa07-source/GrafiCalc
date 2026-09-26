import assert from "node:assert/strict";
import { assertSameOrigin, assertWorkspaceBinding, configPermissions, mergeWorkspace, publicWorkspace, WorkspaceError } from "../lib/workspace-policy.ts";

const members = new Set(["owner-A", "member-A"]);
const stored = {
  config: { rates: [{ value: 12 }], security: { configAccess: { pinHash: "secret" } } },
  security: {
    authUsers: [{ id: "owner-A", email: "a@example.test" }, { id: "owner-B", email: "b@example.test" }],
    accessControl: { configPermissions: { "member-A": { use: true }, "owner-B": { edit: true } } },
  },
  sharedState: { clients: [{ id: "client-A", name: "A" }], quoteHistory: [], workOrders: [] },
};

const visible = publicWorkspace(stored, members);
assert.deepEqual(Array.from(visible.security.authUsers, (user) => user.id), ["owner-A"]);
assert.equal(visible.security.accessControl.configPermissions["owner-B"], undefined);
assert.equal(visible.config.security.configAccess.pinHash, undefined);
assert.equal(visible.config.rates[0].value, 12);

assert.deepEqual(configPermissions(stored, "member-A", false), { use: true, edit: false, managePin: false });
assert.deepEqual(configPermissions(stored, "owner-A", true), { use: true, edit: true, managePin: true });

assert.throws(() => assertWorkspaceBinding(new Request("https://graficalc.test/api", { headers: { "X-GrafiCalc-User": "owner-B", "X-GrafiCalc-Tenant": "tenant-A" } }), "owner-A", "tenant-A"), (error) => error instanceof WorkspaceError && error.status === 409);
assert.throws(() => assertSameOrigin(new Request("https://graficalc.test/api", { method: "POST", headers: { origin: "https://attacker.test", host: "graficalc.test" } })), (error) => error instanceof WorkspaceError && error.status === 403);

const unchanged = mergeWorkspace(stored, { sharedState: { clients: [{ id: "client-B" }], quoteHistory: [], workOrders: [] }, config: { rates: [{ value: 999 }] } }, { isLeader: false, canEdit: false, publishConfig: false, pinVerified: false, memberIds: members });
assert.deepEqual(unchanged.config.rates, stored.config.rates);
assert.equal(unchanged.sharedState.clients[0].id, "client-B");

assert.throws(() => mergeWorkspace(stored, { config: { rates: [] }, sharedState: { clients: [], quoteHistory: [], workOrders: [] } }, { isLeader: true, canEdit: true, publishConfig: true, pinVerified: false, memberIds: members }), (error) => error instanceof WorkspaceError && error.message === "config-pin-required");
const published = mergeWorkspace(stored, { config: { rates: [{ value: 20 }], security: { configAccess: { pinHash: "attacker-value" } } } }, { isLeader: true, canEdit: true, publishConfig: true, pinVerified: true, memberIds: members });
assert.equal(published.config.rates[0].value, 20);
assert.equal(published.config.security.configAccess.pinHash, "secret");

console.log("workspace-policy: 9 isolation, authorization, redaction, and PIN-gate assertions passed");
