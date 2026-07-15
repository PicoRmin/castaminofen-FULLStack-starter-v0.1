import type { FeedHealthLifecycleEvent } from '../events';

export interface FeedHealthLifecycleHooks {
  readonly onEvaluationStarted?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
  readonly onMetricsCollected?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
  readonly onScoreCalculated?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
  readonly onClassificationCompleted?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
  readonly onReportGenerated?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
  readonly onEvaluationFailed?: (event: FeedHealthLifecycleEvent) => void | Promise<void>;
}
