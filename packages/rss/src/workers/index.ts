import { NotImplementedError } from '../shared';

export abstract class BaseWorker {
  public run(): Promise<void> {
    throw new NotImplementedError();
  }
}

export class ImportWorker extends BaseWorker {}

export class SyncWorker extends BaseWorker {}

export class RetryWorker extends BaseWorker {}

export class StatisticsWorker extends BaseWorker {}
