import type { JobContext } from '../context/job-context';
import type { FeedHealthEvaluator } from '../../health/evaluation/feed-health-evaluator';
import type { FeedHealthMetricSet } from '../../health/types/feed-health';

export interface HealthEvaluationJobHandlerDependencies {
  readonly evaluator: FeedHealthEvaluator;
}

export class HealthEvaluationJobHandler {
  private readonly evaluator: FeedHealthEvaluator;

  public constructor(dependencies: HealthEvaluationJobHandlerDependencies) {
    this.evaluator = dependencies.evaluator;
  }

  public async execute(context: JobContext): Promise<unknown> {
    const payload = context.job.payload as { feedId?: string; metrics?: Record<string, unknown> } | undefined;
    const metrics: FeedHealthMetricSet = {
      successRate: 0,
      failureRate: 0,
      averageSyncDurationMs: 0,
      averageDownloadTimeMs: 0,
      averageImportTimeMs: 0,
      checkpointAgeMs: 0,
      feedFreshnessMs: 0,
      episodeGrowth: 0,
      synchronizationFrequency: 0,
      metadataChanges: 0,
      providerAvailability: 0,
      ...(payload?.metrics as Partial<FeedHealthMetricSet> | undefined),
    };
    return this.evaluator.evaluate({
      feedId: payload?.feedId ?? context.feedId ?? 'unknown-feed',
      metrics,
      metadata: { workerId: context.workerId, executionId: context.executionId },
    });
  }
}
