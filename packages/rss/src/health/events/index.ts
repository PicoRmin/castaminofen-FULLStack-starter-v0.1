export interface FeedHealthLifecycleEvent {
  readonly type:
    | 'evaluation-started'
    | 'metrics-collected'
    | 'score-calculated'
    | 'classification-completed'
    | 'report-generated'
    | 'evaluation-failed';
  readonly feedId: string;
  readonly timestamp: number;
  readonly payload?: Readonly<Record<string, unknown>>;
}
