import type { JobContext } from '../context/job-context';
import type { SynchronizationRecoveryEngine } from '../../synchronization/recovery';

export interface RecoveryJobHandlerDependencies {
  readonly recoveryEngine: SynchronizationRecoveryEngine;
}

export class RecoveryJobHandler {
  private readonly recoveryEngine: SynchronizationRecoveryEngine;

  public constructor(dependencies: RecoveryJobHandlerDependencies) {
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
