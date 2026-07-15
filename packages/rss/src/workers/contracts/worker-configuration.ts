import type { QueueJobKind, QueuePriority } from '../../queue/types/queue-types';

export type WorkerLifecycleState = 'idle' | 'starting' | 'ready' | 'running' | 'stopping' | 'stopped' | 'failed';

export interface WorkerConfiguration {
  readonly workerId: string;
  readonly queueName: string;
  readonly kind?: QueueJobKind | string;
  readonly concurrency?: number;
  readonly parallelWorkers?: number;
  readonly backpressure?: boolean;
  readonly idleWorkers?: boolean;
  readonly leaseRenewalMs?: number;
  readonly timeoutMs?: number;
  readonly maxAttempts?: number;
  readonly cancellationMode?: 'cooperative' | 'graceful';
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly priority?: QueuePriority;
}
