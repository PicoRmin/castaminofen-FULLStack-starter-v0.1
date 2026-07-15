export interface IncrementalSynchronizationLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}
