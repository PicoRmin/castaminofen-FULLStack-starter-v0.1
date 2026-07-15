export interface SynchronizationLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context: Record<string, unknown> | undefined;
}

export * from './feed-state-events';
export * from './incremental';
export * from './locking';

export interface SynchronizationLifecycleHooks {
  readonly onStarted?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onProgress?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onCompleted?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onFailed?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onCancelled?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onSkipped?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
  readonly onStateChanged?: (event: SynchronizationLifecycleEvent) => void | Promise<void>;
}
