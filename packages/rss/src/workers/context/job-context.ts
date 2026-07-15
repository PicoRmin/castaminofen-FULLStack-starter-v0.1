import type { QueueJobEnvelope } from '../../queue/contracts/queue-job-contract';
import type { QueueConfiguration } from '../../queue/configuration/queue-configuration';

export interface JobContext {
  readonly jobId: string;
  readonly correlationId: string;
  readonly feedId?: string | undefined;
  readonly workerId: string;
  readonly queueName: string;
  readonly executionId: string;
  readonly attempt: number;
  readonly priority: string;
  readonly cancellationToken: { readonly cancelled: boolean; cancel(): void };
  readonly executionMetadata: Readonly<Record<string, unknown>>;
  readonly job: QueueJobEnvelope;
  readonly createdAt: number;
  readonly timeoutMs: number;
}

export interface JobContextOptions {
  readonly workerId?: string;
  readonly executionId?: string;
  readonly queueName?: string;
  readonly attempt?: number;
  readonly cancellationToken?: JobContext['cancellationToken'];
  readonly executionMetadata?: Readonly<Record<string, unknown>>;
  readonly config?: QueueConfiguration;
}

export function createJobContext(job: QueueJobEnvelope, options: JobContextOptions = {}): JobContext {
  const executionId = options.executionId ?? `exec-${job.jobId}-${Date.now()}`;
  const cancellationToken = options.cancellationToken ?? {
    cancelled: false,
    cancel: () => {
      Object.assign(token, { cancelled: true });
    },
  };
  const token = cancellationToken;
  return Object.freeze({
    jobId: job.jobId,
    correlationId: job.correlationId,
    feedId: job.feedId,
    workerId: options.workerId ?? 'rss-worker',
    queueName: options.queueName ?? job.queueName,
    executionId,
    attempt: options.attempt ?? 1,
    priority: job.priority,
    cancellationToken: Object.freeze({
      cancelled: token.cancelled,
      cancel: token.cancel,
    }),
    executionMetadata: Object.freeze({ ...(options.executionMetadata ?? {}), source: 'worker-runtime' }),
    job,
    createdAt: Date.now(),
    timeoutMs: job.timeoutMs,
  });
}
