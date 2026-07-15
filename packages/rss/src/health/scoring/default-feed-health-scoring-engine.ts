import type { FeedHealthMetricSet } from '../types/feed-health';
import type { FeedHealthScoringEngine } from '../interfaces/feed-health-scoring-engine';

export class DefaultFeedHealthScoringEngine implements FeedHealthScoringEngine {
  public readonly id = 'default-feed-health-scoring';

  public score(metrics: FeedHealthMetricSet): number {
    const successScore = Math.max(0, Math.min(100, metrics.successRate * 100));
    const failurePenalty = Math.max(0, metrics.failureRate * 60);
    const downloadPenalty = Math.max(0, Math.min(20, metrics.averageDownloadTimeMs / 1000));
    const importPenalty = Math.max(0, Math.min(10, metrics.averageImportTimeMs / 100));
    const freshnessPenalty = Math.max(0, Math.min(20, metrics.feedFreshnessMs / 600000));
    const checkpointPenalty = Math.max(0, Math.min(10, metrics.checkpointAgeMs / 600000));
    const providerPenalty = Math.max(0, Math.min(15, (1 - metrics.providerAvailability) * 100));
    const growthPenalty = Math.max(0, Math.min(5, metrics.episodeGrowth > 0 ? 0 : 0));
    const score =
      successScore -
      failurePenalty -
      downloadPenalty -
      importPenalty -
      freshnessPenalty -
      checkpointPenalty -
      providerPenalty +
      growthPenalty;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
}
