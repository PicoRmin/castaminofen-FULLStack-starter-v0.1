import type { QueueJobKind, QueueJobState, QueuePayloadEnvelope, QueuePriority, QueueRetryPolicy } from '../types/queue-types';

export interface QueueJobEnvelope {
  readonly jobId: string;
  readonly jobType: QueueJobKind;
  readonly correlationId: string;
  readonly feedId?: string | undefined;
  readonly priority: QueuePriority;
  readonly queueName: string;
  readonly payload: unknown;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly creationTime: number;
  readonly retryPolicy: QueueRetryPolicy;
  readonly timeoutMs: number;
  readonly version: number;
  readonly state: QueueJobState;
  readonly delayMs?: number | undefined;
  readonly expiresAt?: number | undefined;
}

export interface QueueJobContract<TPayload = unknown> extends QueueJobEnvelope {
  readonly payloadEnvelope: QueuePayloadEnvelope<TPayload>;
}
