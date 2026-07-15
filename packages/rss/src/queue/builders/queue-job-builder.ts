import type { QueueJobEnvelope } from '../contracts/queue-job-contract';
import type { QueueJobKind, QueuePriority, QueueRetryPolicy, QueueJobState } from '../types/queue-types';

export class QueueJobBuilder {
  private jobId = `job-${Math.random().toString(36).slice(2, 10)}`;
  private jobType: QueueJobKind = 'custom';
  private correlationId = `corr-${Math.random().toString(36).slice(2, 10)}`;
  private feedId?: string;
  private priority: QueuePriority = 'normal';
  private queueName = 'default';
  private payload: unknown = {};
  private metadata: Record<string, unknown> = { source: 'queue-builder' };
  private creationTime = Date.now();
  private retryPolicy: QueueRetryPolicy = {
    attempts: 3,
    backoffMs: 1000,
    maxDelayMs: 10000,
    strategy: 'exponential',
  };
  private timeoutMs = 30000;
  private version = 1;
  private state: QueueJobState = 'created';
  private delayMs?: number;
  private expiresAt?: number;

  public withJobType(jobType: QueueJobKind): this {
    this.jobType = jobType;
    return this;
  }

  public withFeedId(feedId: string): this {
    this.feedId = feedId;
    return this;
  }

  public withCorrelationId(correlationId: string): this {
    this.correlationId = correlationId;
    return this;
  }

  public withPayload(payload: unknown): this {
    this.payload = payload;
    return this;
  }

  public withQueueName(queueName: string): this {
    this.queueName = queueName;
    return this;
  }

  public withRetryPolicy(retryPolicy: QueueRetryPolicy): this {
    this.retryPolicy = retryPolicy;
    return this;
  }

  public withTimeout(timeoutMs: number): this {
    this.timeoutMs = timeoutMs;
    return this;
  }

  public withState(state: QueueJobState): this {
    this.state = state;
    return this;
  }

  public withMetadata(metadata: Record<string, unknown>): this {
    this.metadata = { ...this.metadata, ...metadata };
    return this;
  }

  public build(): QueueJobEnvelope {
    return Object.freeze({
      jobId: this.jobId,
      jobType: this.jobType,
      correlationId: this.correlationId,
      feedId: this.feedId,
      priority: this.priority,
      queueName: this.queueName,
      payload: this.payload,
      metadata: Object.freeze({ ...this.metadata }),
      creationTime: this.creationTime,
      retryPolicy: Object.freeze({ ...this.retryPolicy }),
      timeoutMs: this.timeoutMs,
      version: this.version,
      state: this.state,
      delayMs: this.delayMs,
      expiresAt: this.expiresAt,
    });
  }
}
