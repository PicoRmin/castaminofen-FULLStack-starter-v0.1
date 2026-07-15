import type { FeedHealthMetricSet } from '../types/feed-health';

export interface FeedHealthScoringEngine {
  readonly id: string;
  score(metrics: FeedHealthMetricSet): number;
}
