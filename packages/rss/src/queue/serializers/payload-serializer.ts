export interface PayloadSerializer<TPayload = unknown> {
  serialize(payload: TPayload, options?: { version?: number; compatibilityMode?: boolean }): {
    readonly version: number;
    readonly payload: unknown;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
    readonly createdAt: number;
  };
  deserialize(envelope: {
    readonly version: number;
    readonly payload: unknown;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
    readonly createdAt: number;
  }): { readonly version: number; readonly payload: TPayload; readonly metadata: Readonly<Record<string, unknown>> | undefined; readonly createdAt: number };
}
