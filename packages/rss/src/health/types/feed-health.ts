import type { FeedHealthStatus, FeedHealthTrendDirection } from './health-status';

export interface FeedHealthMetricSet {
  readonly successRate: number;
  readonly failureRate: number;
  readonly averageSyncDurationMs: number;
  readonly averageDownloadTimeMs: number;
  readonly averageImportTimeMs: number;
  readonly checkpointAgeMs: number;
  readonly feedFreshnessMs: number;
  readonly episodeGrowth: number;
  readonly synchronizationFrequency: number;
  readonly metadataChanges: number;
  readonly providerAvailability: number;
  readonly [key: string]: number | undefined;
}

export interface FeedHealthWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: 'info' | 'warning' | 'critical';
}

export interface FeedHealthTrendMetadata {
  readonly direction: FeedHealthTrendDirection;
  readonly confidence: number;
  readonly previousScore?: number | undefined;
  readonly currentScore?: number | undefined;
}

export interface FeedHealthStatistics {
  readonly successRate: number;
  readonly failureRate: number;
  readonly averageSyncDurationMs: number;
  readonly averageDownloadTimeMs: number;
  readonly averageImportTimeMs: number;
  readonly checkpointAgeMs: number;
  readonly feedFreshnessMs: number;
  readonly episodeGrowth: number;
  readonly synchronizationFrequency: number;
  readonly metadataChanges: number;
  readonly providerAvailability: number;
  readonly [key: string]: number | undefined;
}

export interface FeedHealth {
  readonly feedId: string;
  readonly score: number;
  readonly status: FeedHealthStatus;
  readonly evaluatedAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly warnings: readonly FeedHealthWarning[];
  readonly statistics: FeedHealthStatistics;
  readonly version: number;
  readonly evaluationDurationMs: number;
  readonly trend: FeedHealthTrendMetadata;
}

export function createFeedHealth(input: {
  feedId: string;
  score: number;
  status: FeedHealthStatus;
  evaluatedAt: Date;
  version?: number;
  metadata?: Record<string, unknown>;
  warnings?: readonly FeedHealthWarning[];
  statistics?: Partial<FeedHealthStatistics>;
  trend?: FeedHealthTrendMetadata;
  evaluationDurationMs?: number;
}): FeedHealth {
  const statistics = Object.freeze({
    successRate: input.statistics?.successRate ?? 0,
    failureRate: input.statistics?.failureRate ?? 0,
    averageSyncDurationMs: input.statistics?.averageSyncDurationMs ?? 0,
    averageDownloadTimeMs: input.statistics?.averageDownloadTimeMs ?? 0,
    averageImportTimeMs: input.statistics?.averageImportTimeMs ?? 0,
    checkpointAgeMs: input.statistics?.checkpointAgeMs ?? 0,
    feedFreshnessMs: input.statistics?.feedFreshnessMs ?? 0,
    episodeGrowth: input.statistics?.episodeGrowth ?? 0,
    synchronizationFrequency: input.statistics?.synchronizationFrequency ?? 0,
    metadataChanges: input.statistics?.metadataChanges ?? 0,
    providerAvailability: input.statistics?.providerAvailability ?? 0,
  }) as FeedHealthStatistics;
  const health = Object.freeze({
    feedId: input.feedId,
    score: input.score,
    status: input.status,
    evaluatedAt: input.evaluatedAt,
    metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    warnings: Object.freeze([...(input.warnings ?? [])]),
    statistics,
    version: input.version ?? 1,
    evaluationDurationMs: input.evaluationDurationMs ?? 0,
    trend: Object.freeze({
      direction: input.trend?.direction ?? 'Unknown',
      confidence: input.trend?.confidence ?? 0,
      previousScore: input.trend?.previousScore,
      currentScore: input.trend?.currentScore,
    }) as FeedHealthTrendMetadata,
  }) as FeedHealth;
  return health;
}
