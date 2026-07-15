export interface ObservabilityContext {
  readonly observationId: string;
  readonly correlationId: string;
  readonly timestamp: number;
  readonly component: string;
  readonly resource: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly collectionPolicy: Readonly<{
    readonly sampling: number;
    readonly refreshIntervalMs: number;
    readonly retentionMs: number;
    readonly aggregationWindowMs: number;
    readonly historicalDepth: number;
    readonly filtering: Readonly<Record<string, string | boolean | number>>;
    readonly grouping: ReadonlyArray<string>;
    readonly featureFlags: Readonly<Record<string, boolean>>;
  }>;
  readonly version: number;
}

export interface ObservabilityContextInput {
  readonly observationId?: string;
  readonly correlationId?: string;
  readonly timestamp?: number;
  readonly component: string;
  readonly resource: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly collectionPolicy?: Readonly<{
    readonly sampling?: number;
    readonly refreshIntervalMs?: number;
    readonly retentionMs?: number;
    readonly aggregationWindowMs?: number;
    readonly historicalDepth?: number;
    readonly filtering?: Readonly<Record<string, string | boolean | number>>;
    readonly grouping?: ReadonlyArray<string>;
    readonly featureFlags?: Readonly<Record<string, boolean>>;
  }>;
  readonly version?: number;
}

export function createObservabilityContext(input: ObservabilityContextInput): ObservabilityContext {
  const collectionPolicy = Object.freeze({
    sampling: input.collectionPolicy?.sampling ?? 1,
    refreshIntervalMs: input.collectionPolicy?.refreshIntervalMs ?? 5000,
    retentionMs: input.collectionPolicy?.retentionMs ?? 3_600_000,
    aggregationWindowMs: input.collectionPolicy?.aggregationWindowMs ?? 60_000,
    historicalDepth: input.collectionPolicy?.historicalDepth ?? 10,
    filtering: Object.freeze({ ...(input.collectionPolicy?.filtering ?? {}) }),
    grouping: Object.freeze([...(input.collectionPolicy?.grouping ?? [])]),
    featureFlags: Object.freeze({ ...(input.collectionPolicy?.featureFlags ?? {}) }),
  });

  return Object.freeze({
    observationId: input.observationId ?? `obs-${Math.random().toString(36).slice(2, 10)}`,
    correlationId:
      input.correlationId ??
      input.observationId ??
      `corr-${Math.random().toString(36).slice(2, 10)}`,
    timestamp: input.timestamp ?? Date.now(),
    component: input.component,
    resource: input.resource,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    collectionPolicy,
    version: input.version ?? 1,
  });
}
