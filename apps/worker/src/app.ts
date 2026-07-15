import { LoggerService } from '@castaminofen/logger';
import { WorkerService } from './worker-service.js';

export interface AppContract {
  readonly name: string;
  start(): Promise<string>;
  stop(): Promise<void>;
}

export class AppBootstrap implements AppContract {
  private workerService?: WorkerService;

  constructor(public readonly name: string) {}

  async start(): Promise<string> {
    const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
    const logger = new LoggerService({
      name: '@castaminofen/app-worker',
      version: '0.1.0',
      enabled: true,
    });

    this.workerService = new WorkerService({
      redisUrl,
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
      prefix: process.env.REDIS_PREFIX ?? 'castaminofen',
      logger,
    });

    await this.workerService.start();
    logger.info(`Worker application bootstrap completed for ${this.name}`, 'worker');
    return `${this.name} started`;
  }

  async stop(): Promise<void> {
    await this.workerService?.stop();
  }
}
