export interface FeedStateLifecycleEvent {
  readonly type: string;
  readonly state?: unknown;
  readonly checkpoint?: unknown;
  readonly snapshot?: unknown;
  readonly timestamp: number;
}

export interface FeedStateLifecycleHooks {
  readonly onStateCreated?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onStateUpdated?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onCheckpointCreated?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onCheckpointRestored?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onCheckpointInvalidated?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onSnapshotCreated?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
  readonly onTransitionCompleted?: (event: FeedStateLifecycleEvent) => void | Promise<void>;
}
