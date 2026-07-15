import type { JobContext } from '../context/job-context';
import type { SynchronizationRecoveryEngine } from '../../synchronization/recovery';

export interface RetryJobHandlerDependencies {
  readonly recoveryEngine: SynchronizationRecoveryEngine;
}

export class RetryJobHandler {
  private readonly recoveryEngine: SynchronizationRecoveryEngine;

  public constructor(dependencies: RetryJobHandlerDependencies) {
    this.recoveryEngine = dependencies.recoveryEngine;
  }

  public async execute(context: JobContext): Promise<unknown> {
    return this.recoveryEngine.evaluateFailure({
      feedId: context.feedId ?? 'unknown-feed',
      failure: context.job.payload,
      attempt: context.attempt,
      maxRetries: 3,
      metadata: { workerId: context.workerId, executionId: context.executionId },
    });
  }
}
