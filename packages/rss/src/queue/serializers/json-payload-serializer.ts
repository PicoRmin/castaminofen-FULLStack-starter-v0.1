import type { PayloadSerializer } from './payload-serializer';

export class JsonPayloadSerializer implements PayloadSerializer<unknown> {
  public serialize(payload: unknown, options: { version?: number; compatibilityMode?: boolean } = {}): {
    readonly version: number;
    readonly payload: unknown;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
    readonly createdAt: number;
  } {
    const version = options.version ?? 1;
    const normalized = this.normalize(payload, options.compatibilityMode ?? false);
    return Object.freeze({
      version,
      payload: normalized,
      metadata: Object.freeze({ serializer: 'json', compatibilityMode: options.compatibilityMode ?? false }),
      createdAt: Date.now(),
    });
  }

  public deserialize(envelope: {
    readonly version: number;
    readonly payload: unknown;
    readonly metadata: Readonly<Record<string, unknown>> | undefined;
    readonly createdAt: number;
  }): { readonly version: number; readonly payload: unknown; readonly metadata: Readonly<Record<string, unknown>> | undefined; readonly createdAt: number } {
    return Object.freeze({
      version: envelope.version,
      payload: this.normalize(envelope.payload, false),
      metadata: envelope.metadata ? Object.freeze({ ...envelope.metadata }) : undefined,
      createdAt: envelope.createdAt,
    });
  }

  private normalize(value: unknown, compatibilityMode: boolean): unknown {
    if (typeof value === 'string') {
      return compatibilityMode ? value.trim() : value;
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.normalize(entry, compatibilityMode));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, this.normalize(entry, compatibilityMode)]),
      );
    }

    return value;
  }
}
