export * from './contracts/worker-configuration';
export * from './contracts/worker-handler-contract';
export * from './contracts/worker-runtime-contract';
export * from './context/job-context';
export * from './dispatcher/default-job-dispatcher';
export * from './errors/worker-errors';
export * from './events/worker-events';
export * from './handlers/import-job-handler';
export * from './handlers/synchronization-job-handler';
export * from './handlers/retry-job-handler';
export * from './handlers/recovery-job-handler';
export * from './handlers/validation-job-handler';
export * from './handlers/maintenance-job-handler';
export * from './handlers/health-evaluation-job-handler';
export * from './handlers/metrics-collection-job-handler';
export * from './handlers/in-memory-handler-registry';
export * from './runtime/default-worker-runtime';
export * from './runtime/default-worker-factory';
export * from './runtime/worker-registry';
export * from './runtime/worker-lifecycle';
export * from './types/worker-types';

export abstract class BaseWorker {
  public run(): Promise<void> {
    return Promise.resolve();
  }
}

export class ImportWorker extends BaseWorker {}
export class SyncWorker extends BaseWorker {}
export class RetryWorker extends BaseWorker {}
export class StatisticsWorker extends BaseWorker {}
