export type SanitizableAsaasEvent = {
  dateCreated?: unknown;
  checkout?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  subscription?: Record<string, unknown>;
};

export declare function isKnownAsaasEvent(eventType: string): boolean;
export declare function sanitizeAsaasEvent(eventType: string, payload: SanitizableAsaasEvent): Record<string, unknown>;
