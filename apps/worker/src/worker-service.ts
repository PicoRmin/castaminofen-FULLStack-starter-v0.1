import {
  Queue,
  QueueEvents,
  Worker,
  type ConnectionOptions,
  type Job,
  type JobsOptions,
  type WorkerOptions,
} from 'bullmq';
import Redis from 'ioredis';
import { LoggerService } from '@castaminofen/logger';
import { buildJobId, resolveRetryDecision, type RetryContext } from './job-engine.js';

export interface WorkerServiceConfig {
  readonly redisUrl: string;
  readonly concurrency?: number;
  readonly prefix?: string;
  readonly logger?: LoggerService;
}

export interface WorkerMetrics {
  readonly queued: number;
  readonly processed: number;
  readonly failed: number;
  readonly deadLettered: number;
}

export type WorkerJobName =
  'email' | 'media' | 'rss-import' | 'search-index' | 'recommendation' | 'notification';

export interface WorkerJobPayload {
  readonly id?: string;
  readonly type: WorkerJobName;
  readonly data?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

export class WorkerService {
  private readonly logger: LoggerService;
  private readonly redis: Redis;
  private readonly queue: Queue;
  private readonly deadLetterQueue: Queue;
  private readonly queueEvents: QueueEvents;
  private readonly workers: Worker[] = [];
  private readonly metrics = {
    queued: 0,
    processed: 0,
    failed: 0,
    deadLettered: 0,
  };

  constructor(private readonly config: WorkerServiceConfig) {
    this.logger =
      config.logger ??
      new LoggerService({ name: '@castaminofen/app-worker', version: '0.1.0', enabled: true });
    this.redis = new Redis(this.config.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
    });
    const connection = this.redis as unknown as ConnectionOptions;

    this.queue = new Queue('castaminofen-jobs', {
      connection,
      prefix: this.config.prefix ?? 'castaminofen',
    });
    this.deadLetterQueue = new Queue('castaminofen-dlq', {
      connection,
      prefix: this.config.prefix ?? 'castaminofen',
    });
    this.queueEvents = new QueueEvents('castaminofen-jobs', {
      connection,
      prefix: this.config.prefix ?? 'castaminofen',
    });
  }

  async start(): Promise<void> {
    await this.redis.connect();
    await this.queue.waitUntilReady();
    await this.queueEvents.waitUntilReady();

    const workerOptions: WorkerOptions = {
      connection: this.redis as unknown as ConnectionOptions,
      prefix: this.config.prefix ?? 'castaminofen',
      concurrency: this.config.concurrency ?? 2,
    };

    this.workers.push(
      new Worker<WorkerJobPayload>(
        'castaminofen-jobs',
        async (job) => this.handleJob(job),
        workerOptions,
      ),
    );

    this.logger.info('Worker service started with BullMQ and Redis', 'worker');
  }

  async stop(): Promise<void> {
    for (const worker of this.workers) {
      await worker.close();
    }
    await this.queue.close();
    await this.deadLetterQueue.close();
    await this.queueEvents.close();
    await this.redis.quit();
  }

  getMetrics(): WorkerMetrics {
    return { ...this.metrics };
  }

  async enqueue(job: WorkerJobPayload, options?: JobsOptions): Promise<string> {
    const payload: WorkerJobPayload = {
      ...job,
      id: job.id ?? buildJobId(job.type),
    };

    this.metrics.queued += 1;

    const created = await this.queue.add(payload.type, payload, {
      ...options,
      attempts: options?.attempts ?? 3,
      backoff: options?.backoff ?? { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    this.logger.info(`Enqueued job ${created.id} for ${payload.type}`, 'worker');
    return created.id ?? payload.id ?? 'unknown';
  }

  private async handleJob(job: Job<WorkerJobPayload, unknown, string>): Promise<void> {
    const payload = job.data;
    this.logger.info(`Processing ${payload.type} job ${payload.id ?? job.name}`, 'worker');

    try {
      await this.processJobPayload(payload);
      this.metrics.processed += 1;
    } catch (error) {
      this.metrics.failed += 1;
      const retryContext: RetryContext = {
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts ?? 3,
        error,
      };
      const decision = resolveRetryDecision(retryContext);

      this.logger.warn(
        `Job ${payload.id ?? job.name} failed: ${error instanceof Error ? error.message : String(error)} (${decision.reason})`,
        'worker',
      );

      if (decision.shouldRetry) {
        throw error;
      }

      if (decision.shouldDeadLetter) {
        await this.sendToDeadLetterQueue(payload, error);
        return;
      }
    }
  }

  private async processJobPayload(payload: WorkerJobPayload): Promise<void> {
    switch (payload.type) {
      case 'email':
        await this.processEmail(payload);
        break;
      case 'media':
        await this.processMedia(payload);
        break;
      case 'rss-import':
        await this.processRssImport(payload);
        break;
      case 'search-index':
        await this.processSearchIndex(payload);
        break;
      case 'recommendation':
        await this.processRecommendation(payload);
        break;
      case 'notification':
        await this.processNotification(payload);
        break;
      default:
        this.logger.warn(
          `Unsupported worker job type ${(payload as { type: string }).type}`,
          'worker',
        );
    }
  }

  private async processEmail(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(`Email job processed for ${payload.id ?? 'unknown'}`, 'worker');
    await Promise.resolve();
  }

  private async processMedia(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(`Media job processed for ${payload.id ?? 'unknown'}`, 'worker');
    await Promise.resolve();
  }

  private async processRssImport(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(`RSS import job processed for ${payload.id ?? 'unknown'}`, 'worker');
    await Promise.resolve();
  }

  private async processSearchIndex(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(`Search indexing job processed for ${payload.id ?? 'unknown'}`, 'worker');
    await Promise.resolve();
  }

  private async processRecommendation(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(
      `Recommendation update job processed for ${payload.id ?? 'unknown'}`,
      'worker',
    );
    await Promise.resolve();
  }

  private async processNotification(payload: WorkerJobPayload): Promise<void> {
    this.logger.info(
      `Notification delivery job processed for ${payload.id ?? 'unknown'}`,
      'worker',
    );
    await Promise.resolve();
  }

  private async sendToDeadLetterQueue(payload: WorkerJobPayload, error: unknown): Promise<void> {
    this.metrics.deadLettered += 1;

    await this.deadLetterQueue.add(
      'dead-letter',
      {
        ...payload,
        metadata: {
          ...(payload.metadata ?? {}),
          failedAt: new Date().toISOString(),
          error: error instanceof Error ? error.message : String(error),
        },
      },
      {
        attempts: 1,
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.error(`Dead-lettered job ${payload.id ?? 'unknown'}`, 'worker');
  }
}
