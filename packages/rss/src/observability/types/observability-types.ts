export type ObservabilityComponent =
  | 'queue'
  | 'worker'
  | 'job'
  | 'trigger'
  | 'scheduler'
  | 'retry'
  | 'recovery'
  | 'dead-letter'
  | 'health'
  | 'metrics'
  | 'telemetry'
  | 'custom';

export type MonitoringStatus =
  | 'unknown'
  | 'active'
  | 'idle'
  | 'ready'
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'degraded'
  | 'stopped'
  | 'failed';

export interface CollectionPolicy {
  readonly sampling: number;
  readonly refreshIntervalMs: number;
  readonly retentionMs: number;
  readonly aggregationWindowMs: number;
  readonly historicalDepth: number;
  readonly filtering: Readonly<Record<string, string | boolean | number>>;
  readonly grouping: ReadonlyArray<string>;
  readonly featureFlags: Readonly<Record<string, boolean>>;
}

export interface ObservabilityConfiguration {
  readonly sampling?: number;
  readonly refreshIntervalMs?: number;
  readonly retentionMs?: number;
  readonly aggregationWindowMs?: number;
  readonly historicalDepth?: number;
  readonly filtering?: Readonly<Record<string, string | boolean | number>>;
  readonly grouping?: ReadonlyArray<string>;
  readonly featureFlags?: Readonly<Record<string, boolean>>;
}

export function createCollectionPolicy(
  configuration: ObservabilityConfiguration = {},
): CollectionPolicy {
  return Object.freeze({
    sampling: configuration.sampling ?? 1,
    refreshIntervalMs: configuration.refreshIntervalMs ?? 5000,
    retentionMs: configuration.retentionMs ?? 3_600_000,
    aggregationWindowMs: configuration.aggregationWindowMs ?? 60_000,
    historicalDepth: configuration.historicalDepth ?? 10,
    filtering: Object.freeze({ ...(configuration.filtering ?? {}) }),
    grouping: Object.freeze([...(configuration.grouping ?? [])]),
    featureFlags: Object.freeze({ ...(configuration.featureFlags ?? {}) }),
  });
}
