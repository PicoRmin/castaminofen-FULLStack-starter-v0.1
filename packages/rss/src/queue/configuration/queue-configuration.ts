export interface QueueConfiguration {
  readonly queueName: string;
  readonly prefix: string;
  readonly concurrency: number;
  readonly attempts: number;
  readonly timeoutMs: number;
  readonly priority: 'critical' | 'high' | 'normal' | 'low' | 'background';
  readonly backoffMs: number;
  readonly delayMs: number;
  readonly retentionMs: number;
  readonly deadLetterQueue?: string | undefined;
  readonly redisConnection?: string | undefined;
}

export interface QueueConfigurationInput {
  readonly queueName: string;
  readonly prefix?: string;
  readonly concurrency?: number;
  readonly attempts?: number;
  readonly timeoutMs?: number;
  readonly priority?: QueueConfiguration['priority'];
  readonly backoffMs?: number;
  readonly delayMs?: number;
  readonly retentionMs?: number;
  readonly deadLetterQueue?: string | undefined;
  readonly redisConnection?: string | undefined;
}

export function createQueueConfiguration(input: QueueConfigurationInput): QueueConfiguration {
  return Object.freeze({
    queueName: input.queueName,
    prefix: input.prefix ?? 'rss',
    concurrency: input.concurrency ?? 1,
    attempts: input.attempts ?? 3,
    timeoutMs: input.timeoutMs ?? 30000,
    priority: input.priority ?? 'normal',
    backoffMs: input.backoffMs ?? 1000,
    delayMs: input.delayMs ?? 0,
    retentionMs: input.retentionMs ?? 86400000,
    deadLetterQueue: input.deadLetterQueue,
    redisConnection: input.redisConnection,
  });
}
