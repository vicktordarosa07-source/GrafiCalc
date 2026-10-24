import assert from "node:assert/strict";
import { getCollectionAccess, scopeWorkspaceCollections, prepareWorkspaceCollections, WorkspaceError } from "../lib/workspace-policy.ts";

const owner = "owner", worker = "worker";
const stored = {
  security: {
    accessControl: {
      groups: [{ id: "funcionarios", tabs: { clientes: false, historico: false, os: false, novoOrcamento: true, orcamento: true } }],
    },
  },
  sharedState: {
    clients: [{ id: "c1", name: "Cliente" }],
    quoteHistory: [
      { id: "q1", createdByUserId: owner, total: 10 },
      { id: "q2", createdByUserId: worker, total: 20 },
    ],
    workOrders: [{ id: "os1" }],
  },
};
const workerAccess = getCollectionAccess(stored, worker, false, { papel: "funcionario" });
assert.deepEqual(workerAccess, {
  clientsRead: true, clientsWrite: false, quotesReadAll: false,
  quotesWrite: true, ordersRead: false, ordersWrite: false,
});
const view = scopeWorkspaceCollections({ ...stored, state: stored.sharedState }, workerAccess, worker);
assert.equal(view.state, undefined);
assert.deepEqual(view.sharedState.clients, stored.sharedState.clients);
assert.deepEqual(view.sharedState.quoteHistory.map(q => q.id), ["q2"]);
assert.deepEqual(view.sharedState.workOrders, []);
const incoming = {
  sharedState: {
    clients: [],
    quoteHistory: [{ id: "q2", createdByUserId: worker, total: 30 },
      { id: "q3", createdByUserId: worker, total: 40 }],
    workOrders: [],
  },
};
const prepared = prepareWorkspaceCollections(stored, incoming, workerAccess, worker);
assert.deepEqual(prepared.sharedState.clients, stored.sharedState.clients);
assert.deepEqual(prepared.sharedState.workOrders, stored.sharedState.workOrders);
assert.deepEqual(prepared.sharedState.quoteHistory.map(q => q.id), ["q1", "q2", "q3"]);
assert.equal(prepared.sharedState.quoteHistory[1].total, 30);
assert.throws(() => prepareWorkspaceCollections(stored, {
  sharedState: { clients: [], quoteHistory: [{ id: "q1", createdByUserId: worker }], workOrders: [] },
}, workerAccess, worker), error => error instanceof WorkspaceError && error.status === 403);
const leaderAccess = getCollectionAccess(stored, owner, true, { papel: "admin" });
assert.equal(leaderAccess.clientsWrite, true);
assert.equal(leaderAccess.ordersWrite, true);
const denied = getCollectionAccess({ ...stored, security: {
  accessControl: { groups: [{ id: "funcionarios", tabs: { clientes: false, historico: false, os: false, novoOrcamento: false, orcamento: false } }] },
} }, worker, false, { papel: "funcionario" });
assert.deepEqual(scopeWorkspaceCollections(stored, denied, worker).sharedState.clients, []);
assert.deepEqual(scopeWorkspaceCollections(stored, denied, worker).sharedState.quoteHistory, []);
console.log("collection-policy: authorization assertions passed");
