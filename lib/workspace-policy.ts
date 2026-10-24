export type JsonObject = Record<string, any>;

export class WorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 403) { super(message); this.status = status; }
}

const privateKeys = new Set([
  "password", "passwordMode", "mustChangePassword", "temporaryPasswordIssuedAt",
  "pinHash", "temporaryPinHash", "temporaryPinExpiresAt", "temporaryPinUserId", "pinVersion",
]);

export function publicData(value: any): any {
  if (Array.isArray(value)) return value.map(publicData);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !privateKeys.has(key))
    .map(([key, nested]) => [key, publicData(nested)]));
}

export function configPermissions(payload: JsonObject, userId: string, isLeader: boolean) {
  const grant = payload.security?.accessControl?.configPermissions?.[userId] || {};
  return {
    use: isLeader || grant.use === true || grant.edit === true,
    edit: isLeader || grant.edit === true,
    managePin: isLeader || grant.managePin === true,
  };
}

export function assertWorkspaceBinding(request: Request, userId: string, tenantId: string) {
  if (request.headers.get("X-GrafiCalc-User") !== userId || request.headers.get("X-GrafiCalc-Tenant") !== tenantId) {
    throw new WorkspaceError("workspace-session-changed", 409);
  }
}

export function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new WorkspaceError("invalid-origin");
  if (origin) {
    try { if (new URL(origin).host === host) return; } catch { /* Invalid origins are rejected. */ }
    throw new WorkspaceError("invalid-origin");
  }
}

export function scopedSecurity(payload: JsonObject, memberIds: Set<string>) {
  const security = publicData(payload.security || {});
  const access = security.accessControl || {};
  for (const key of ["userOverrides", "dashboardOverrides", "configPermissions"]) {
    access[key] = Object.fromEntries(Object.entries(access[key] || {}).filter(([id]) => memberIds.has(id)));
  }
  return { ...security, authUsers: (Array.isArray(security.authUsers) ? security.authUsers : []).filter((u: JsonObject) => u && memberIds.has(u.id)), accessControl: access };
}

export function publicWorkspace(payload: JsonObject, memberIds: Set<string>) {
  return { ...publicData(payload), security: scopedSecurity(payload, memberIds) };
}

// Config credentials are exclusively writable through the PIN endpoints.
export function mergeWorkspace(previous: JsonObject, incoming: JsonObject, options: {
  isLeader: boolean; canEdit: boolean; publishConfig: boolean; pinVerified: boolean; memberIds: Set<string>;
}) {
  const next = { ...previous };
  if (incoming.sharedState) {
    next.sharedState = { ...(previous.sharedState || {}) };
    for (const key of ["clients", "quoteHistory", "workOrders"]) {
      if (!Array.isArray(incoming.sharedState[key])) throw new WorkspaceError("invalid-collections", 400);
      next.sharedState[key] = publicData(incoming.sharedState[key]);
    }
    if (incoming.sharedState.company && typeof incoming.sharedState.company === "object" && options.isLeader) {
      next.sharedState.company = publicData(incoming.sharedState.company);
    }
  }
  if (options.publishConfig) {
    if (!options.canEdit) throw new WorkspaceError("config-edit-forbidden");
    if (!options.pinVerified) throw new WorkspaceError("config-pin-required");
    if (!incoming.config || typeof incoming.config !== "object" || Array.isArray(incoming.config)) throw new WorkspaceError("invalid-config", 400);
    next.config = { ...publicData(incoming.config), security: previous.config?.security || {} };
  }
  if (options.isLeader && incoming.security?.accessControl) {
    next.security = { ...(previous.security || {}), accessControl: scopedSecurity(incoming, options.memberIds).accessControl };
  }
  return next;
}


/**
 * Operational permissions are checked on the server, not trusted from
 * the menu rendered in the legacy client. Every user remains tenant-scoped.
 */
export type CollectionAccess = {
  clientsRead: boolean;
  clientsWrite: boolean;
  quotesReadAll: boolean;
  quotesWrite: boolean;
  ordersRead: boolean;
  ordersWrite: boolean;
};

export function getCollectionAccess(
  payload: JsonObject, userId: string, isLeader: boolean, profile: JsonObject | null
): CollectionAccess {
  if (isLeader) return {
    clientsRead: true, clientsWrite: true, quotesReadAll: true,
    quotesWrite: true, ordersRead: true, ordersWrite: true,
  };
  const access = payload.security?.accessControl || {};
  const employee = profile?.papel === "funcionario";
  const directory = Array.isArray(payload.security?.authUsers)
    ? payload.security.authUsers.find((item: JsonObject) => item?.id === userId)
    : null;
  const groupId = employee ? "funcionarios" : String(directory?.groupId || "profissional");
  const groups = Array.isArray(access.groups) ? access.groups : [];
  const group = groups.find((entry: JsonObject) => entry?.id === groupId);
  const defaults = employee
    ? { clientes: false, historico: false, os: false, orcamento: true, novoOrcamento: true }
    : { clientes: true, historico: true, os: true, orcamento: true, novoOrcamento: true };
  const tabs = { ...defaults, ...(group?.tabs || {}), ...(access.userOverrides?.[userId] || {}) };
  const quotesWrite = tabs.historico === true || tabs.orcamento === true || tabs.novoOrcamento === true;
  return {
    clientsRead: tabs.clientes === true || quotesWrite,
    clientsWrite: tabs.clientes === true,
    quotesReadAll: tabs.historico === true,
    quotesWrite,
    ordersRead: tabs.os === true,
    ordersWrite: tabs.os === true,
  };
}

function operationalList(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value : [];
}
function ownQuote(quote: JsonObject, userId: string) {
  return quote?.createdByUserId === userId;
}

/** Filter sensitive operational records; remove legacy 'state' aliases too. */
export function scopeWorkspaceCollections(
  visible: JsonObject, access: CollectionAccess, userId: string
): JsonObject {
  const source = visible.sharedState || visible.state || {};
  const quoteHistory = operationalList(source.quoteHistory);
  const scoped = {
    ...source,
    clients: access.clientsRead ? operationalList(source.clients) : [],
    quoteHistory: access.quotesReadAll ? quoteHistory
      : access.quotesWrite ? quoteHistory.filter(quote => ownQuote(quote, userId)) : [],
    workOrders: access.ordersRead ? operationalList(source.workOrders) : [],
  };
  const output = { ...visible, sharedState: scoped };
  delete output.state;
  return output;
}

/**
 * A restricted PUT is merged with the authoritative stored collections.
 * A user without the relevant permission can never erase another user's
 * data by sending the filtered snapshot received from GET.
 */
export function prepareWorkspaceCollections(
  previous: JsonObject, incoming: JsonObject, access: CollectionAccess, userId: string
): JsonObject {
  if (!incoming.sharedState) return incoming;
  const stored = previous.sharedState || previous.state || {};
  const requested = incoming.sharedState;
  if (!requested || typeof requested !== "object" || Array.isArray(requested)) {
    throw new WorkspaceError("invalid-collections", 400);
  }
  const oldQuotes = operationalList(stored.quoteHistory);
  const newQuotes = operationalList(requested.quoteHistory);
  let quotes = oldQuotes;
  if (access.quotesReadAll && access.quotesWrite) {
    quotes = newQuotes;
  } else if (access.quotesWrite) {
    const existing = new Map(oldQuotes.map(q => [q?.id, q]));
    const seen = new Set<string>();
    for (const quote of newQuotes) {
      if (typeof quote?.id !== "string" || !quote.id || seen.has(quote.id)) {
        throw new WorkspaceError("invalid-quote-ids", 400);
      }
      seen.add(quote.id);
      if (!ownQuote(quote, userId) || (existing.has(quote.id) && !ownQuote(existing.get(quote.id), userId))) {
        throw new WorkspaceError("quote-write-forbidden", 403);
      }
    }
    quotes = [...oldQuotes.filter(quote => !ownQuote(quote, userId)), ...newQuotes];
  }
  return {
    ...incoming,
    sharedState: {
      ...requested,
      clients: access.clientsWrite ? requested.clients : operationalList(stored.clients),
      quoteHistory: quotes,
      workOrders: access.ordersWrite ? requested.workOrders : operationalList(stored.workOrders),
    },
  };
}
