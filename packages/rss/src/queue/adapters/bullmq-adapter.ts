import type { QueueAdapter } from '../interfaces/queue-adapter';
import type { QueueJobEnvelope } from '../contracts/queue-job-contract';
import { QueueAdapterError, QueueConnectionError } from '../errors/queue-errors';
import type { QueueDefinition } from '../types/queue-definition';

export interface BullMqAdapterDependencies {
  readonly connection?: unknown;
  readonly prefix?: string;
}

export class BullMqQueueAdapter implements QueueAdapter<unknown> {
  public readonly name = 'bullmq';
  private readonly connection: unknown;
  private readonly prefix: string;
  private readonly queues = new Map<string, unknown>();

  public constructor(dependencies: BullMqAdapterDependencies = {}) {
    this.connection = dependencies.connection;
    this.prefix = dependencies.prefix ?? 'rss';
  }

  public async createQueue(definition: QueueDefinition): Promise<unknown> {
    if (!definition?.config?.queueName) {
      throw new QueueAdapterError('Queue definition must include a queueName.', { definition });
    }

    if (!this.connection) {
      throw new QueueConnectionError('BullMQ queue adapter requires a Redis connection.', {
        queueName: definition.config.queueName,
      });
    }

    const queue = {
      name: `${this.prefix}:${definition.config.queueName}`,
      config: definition.config,
      kind: definition.kind,
    };
    this.queues.set(definition.name, queue);
    return queue;
  }

  public async getQueue(name: string): Promise<unknown | undefined> {
    return this.queues.get(name);
  }

  public async enqueue(job: QueueJobEnvelope): Promise<string> {
    if (!job?.jobId) {
      throw new QueueAdapterError('Queue job requires a jobId.', { job });
    }

    return `queued:${job.jobId}`;
  }

  public async close(): Promise<void> {
    this.queues.clear();
  }
}
