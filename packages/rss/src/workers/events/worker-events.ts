export interface WorkerLifecycleEvent {
  readonly type: string;
  readonly stage: string;
  readonly message: string;
  readonly context?: Readonly<Record<string, unknown>> | undefined;
  readonly timestamp: number;
}

export interface WorkerLifecycleHooks {
  readonly onWorkerStarted?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onWorkerReady?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onJobAccepted?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onJobStarted?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onJobCompleted?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onJobFailed?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onJobCancelled?: (event: WorkerLifecycleEvent) => void | Promise<void>;
  readonly onWorkerStopped?: (event: WorkerLifecycleEvent) => void | Promise<void>;
}
