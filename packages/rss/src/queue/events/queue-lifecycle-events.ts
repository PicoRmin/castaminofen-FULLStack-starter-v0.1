export interface QueueLifecycleEvent {
  readonly type: string;
  readonly queueName: string;
  readonly timestamp: number;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface QueueLifecycleHooks {
  readonly onQueueCreated?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobQueued?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobStarted?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobCompleted?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobFailed?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobCancelled?: (event: QueueLifecycleEvent) => void | Promise<void>;
  readonly onJobExpired?: (event: QueueLifecycleEvent) => void | Promise<void>;
}
