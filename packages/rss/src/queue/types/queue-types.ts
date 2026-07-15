export type QueueJobState =
  | 'created'
  | 'queued'
  | 'waiting'
  | 'delayed'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'cancelled'
  | 'expired'
  | 'dead-letter';

export type QueuePriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export type QueueJobKind =
  | 'import'
  | 'synchronization'
  | 'retry'
  | 'recovery'
  | 'validation'
  | 'maintenance'
  | 'health-evaluation'
  | 'metrics-collection'
  | 'custom';

export interface QueueRetryPolicy {
  readonly attempts: number;
  readonly backoffMs: number;
  readonly maxDelayMs: number;
  readonly strategy: 'fixed' | 'exponential' | 'custom';
}

export interface QueuePayloadEnvelope<T = unknown> {
  readonly version: number;
  readonly payload: T;
  readonly metadata: Readonly<Record<string, unknown>> | undefined;
  readonly createdAt: number;
}
