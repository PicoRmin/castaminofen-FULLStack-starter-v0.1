export interface FeedHealthMetrics {
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
}
