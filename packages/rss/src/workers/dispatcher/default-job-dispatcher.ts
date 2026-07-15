import type { JobContext } from '../context/job-context';
import type { WorkerHandler } from '../contracts/worker-handler-contract';
import { HandlerResolutionError, JobDispatchError } from '../errors/worker-errors';
import type { InMemoryHandlerRegistry } from '../handlers/in-memory-handler-registry';

export interface DefaultJobDispatcherDependencies {
  readonly handlerRegistry: InMemoryHandlerRegistry;
}

export class DefaultJobDispatcher {
  private readonly handlerRegistry: InMemoryHandlerRegistry;

  public constructor(dependencies: DefaultJobDispatcherDependencies) {
    this.handlerRegistry = dependencies.handlerRegistry;
  }

  public async dispatch(context: JobContext): Promise<{ status: 'completed' | 'failed' | 'cancelled'; result?: unknown; error?: unknown }> {
    if (context.cancellationToken.cancelled) {
      return { status: 'cancelled' };
    }

    const handler = this.resolveHandler(context.job.jobType);
    if (!handler) {
      throw new HandlerResolutionError(`No handler registered for ${context.job.jobType}`, {
        workerId: context.workerId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        executionStage: 'handler-resolution',
        context: { queueName: context.queueName, jobType: context.job.jobType },
        recoveryRecommendation: 'Register a handler for this queue job type before dispatching work.',
      });
    }

    try {
      const result = await handler.execute(context);
      return { status: 'completed', result };
    } catch (error) {
      throw new JobDispatchError(error instanceof Error ? error.message : 'Job dispatch failed', {
        workerId: context.workerId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        executionStage: 'dispatch',
        context: { queueName: context.queueName, jobType: context.job.jobType },
        recoveryRecommendation: 'Inspect the handler implementation and requeue the job after addressing the underlying failure.',
      });
    }
  }

  private resolveHandler(kind: string): WorkerHandler | undefined {
    return this.handlerRegistry.get(kind);
  }
}
