import type { FeedHealthMetricSet } from '../types/feed-health';

export interface FeedHealthEvaluationRequest {
  readonly feedId: string;
  readonly evaluatedAt?: Date;
  readonly metrics: FeedHealthMetricSet;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly previousScore?: number | undefined;
  readonly evaluationDurationMs?: number | undefined;
}
