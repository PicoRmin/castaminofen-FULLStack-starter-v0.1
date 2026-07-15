export interface RecoveryLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context: Record<string, unknown> | undefined;
  readonly timestamp: number;
}

export interface RecoveryLifecycleHooks {
  readonly onFailureClassified?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onRetryScheduled?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onRecoverySelected?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onRecoveryCompleted?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onRetryCancelled?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onPermanentFailure?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
  readonly onCheckpointSelected?: (event: RecoveryLifecycleEvent) => void | Promise<void>;
}
