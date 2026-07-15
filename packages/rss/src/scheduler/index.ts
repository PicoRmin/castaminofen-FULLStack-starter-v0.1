import { NotImplementedError } from '../shared';

export abstract class BaseScheduler {
  public schedule(): Promise<void> {
    throw new NotImplementedError();
  }
}

export class FeedScheduler extends BaseScheduler {}
