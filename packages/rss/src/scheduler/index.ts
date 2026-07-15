export * from './contracts/scheduling-policy-contract';
export * from './contracts/scheduler-trigger-contract';
export * from './context/scheduler-context';
export * from './errors/scheduler-errors';
export * from './events/scheduler-events';
export * from './policies';
export * from './runtime/scheduler-factory';
export * from './runtime/scheduler-registry';
export * from './runtime/scheduler-runtime';
export * from './triggers';
export * from './builders/trigger-builders';
export * from './types';

export abstract class BaseScheduler {
  public constructor(protected readonly dependencies: { readonly id: string; readonly name: string; readonly queueAdapter?: import('../../queue/interfaces/queue-adapter').QueueAdapter }) {}

  public async schedule(): Promise<void> {
    return Promise.resolve();
  }
}

export class FeedScheduler extends BaseScheduler {
  public constructor(dependencies: { readonly id: string; readonly name: string; readonly queueAdapter?: import('../../queue/interfaces/queue-adapter').QueueAdapter }) {
    super(dependencies);
  }
}
