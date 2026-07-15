import { NotImplementedError } from '../shared';

export abstract class BaseStrategy {
  public execute(): Promise<unknown> {
    throw new NotImplementedError();
  }
}

export class ImportStrategy extends BaseStrategy {}

export class SyncStrategy extends BaseStrategy {}
