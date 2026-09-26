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
