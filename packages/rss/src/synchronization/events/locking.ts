export interface FeedLockLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}

export interface FeedLockLifecycleHooks {
  readonly onLockRequested?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onLockAcquired?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onLeaseRenewed?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onLeaseExpired?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onLockReleased?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onConflictDetected?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
  readonly onOwnershipValidated?: (event: FeedLockLifecycleEvent) => void | Promise<void>;
}
