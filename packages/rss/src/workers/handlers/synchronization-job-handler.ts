import type { JobContext } from '../context/job-context';
import type { SynchronizationEngine } from '../../synchronization/core/synchronization-engine';

export interface SynchronizationJobHandlerDependencies {
  readonly synchronizationEngine: SynchronizationEngine;
}

export class SynchronizationJobHandler {
  private readonly synchronizationEngine: SynchronizationEngine;

  public constructor(dependencies: SynchronizationJobHandlerDependencies) {
    this.synchronizationEngine = dependencies.synchronizationEngine;
  }

  public async execute(context: JobContext): Promise<unknown> {
    const payload = context.job.payload as { feedId?: string; feedUrl?: string; mode?: string } | undefined;
    return this.synchronizationEngine.synchronize({
      feedId: payload?.feedId ?? context.feedId ?? 'unknown-feed',
      feedUrl: payload?.feedUrl ?? '',
      mode: (payload?.mode as 'full' | 'incremental' | 'preview' | 'validation' | undefined) ?? 'incremental',
      correlationId: context.correlationId,
      metadata: { workerId: context.workerId, executionId: context.executionId },
      options: { strategy: 'incremental' },
    });
  }
}
