import type { JobContext } from '../context/job-context';
import type { WorkerConfiguration, WorkerLifecycleState } from '../contracts/worker-configuration';
import type { WorkerDispatchResult, WorkerRuntime } from '../contracts/worker-runtime-contract';
import { WorkerExecutionError, WorkerInitializationError, WorkerShutdownError } from '../errors/worker-errors';
import type { DefaultJobDispatcher } from '../dispatcher/default-job-dispatcher';
import type { WorkerLifecycleHooks } from '../events/worker-events';

export interface DefaultWorkerRuntimeDependencies {
  readonly dispatcher: DefaultJobDispatcher;
  readonly configuration: WorkerConfiguration;
  readonly hooks?: WorkerLifecycleHooks;
}

export class DefaultWorkerRuntime implements WorkerRuntime {
  public readonly workerId: string;
  public readonly queueName: string;
  public readonly configuration: WorkerConfiguration;
  private readonly dispatcher: DefaultJobDispatcher;
  private readonly hooks: WorkerLifecycleHooks | undefined;
  private lifecycleState: WorkerLifecycleState = 'idle';

  public constructor(dependencies: DefaultWorkerRuntimeDependencies) {
    this.dispatcher = dependencies.dispatcher;
    this.configuration = dependencies.configuration;
    this.workerId = dependencies.configuration.workerId;
    this.queueName = dependencies.configuration.queueName;
    this.hooks = dependencies.hooks;
  }

  public async start(): Promise<void> {
    if (this.lifecycleState === 'starting' || this.lifecycleState === 'ready' || this.lifecycleState === 'running') {
      return;
    }
    this.lifecycleState = 'starting';
    if (!this.workerId || !this.queueName) {
      throw new WorkerInitializationError('Worker configuration is incomplete.', {
        workerId: this.workerId,
        executionStage: 'initialization',
        context: { queueName: this.queueName },
        recoveryRecommendation: 'Provide a valid worker identifier and queue name before starting the worker.',
      });
    }
    await this.emit('worker-started', 'worker', 'Worker started', { workerId: this.workerId, queueName: this.queueName });
    this.lifecycleState = 'ready';
    await this.emit('worker-ready', 'worker', 'Worker ready', { workerId: this.workerId, queueName: this.queueName });
  }

  public async stop(): Promise<void> {
    if (this.lifecycleState === 'stopped' || this.lifecycleState === 'stopping') {
      return;
    }
    this.lifecycleState = 'stopping';
    await this.emit('worker-stopped', 'worker', 'Worker stopped', { workerId: this.workerId, queueName: this.queueName });
    this.lifecycleState = 'stopped';
  }

  public async dispatch(context: JobContext): Promise<WorkerDispatchResult> {
    if (this.lifecycleState !== 'ready' && this.lifecycleState !== 'running') {
      await this.start();
    }

    const startedAt = Date.now();
    await this.emit('job-accepted', 'dispatch', 'Job accepted', { workerId: this.workerId, jobId: context.jobId, correlationId: context.correlationId });
    this.lifecycleState = 'running';
    await this.emit('job-started', 'dispatch', 'Job started', { workerId: this.workerId, jobId: context.jobId, correlationId: context.correlationId });

    try {
      const outcome = await this.dispatcher.dispatch(context);
      await this.emit(outcome.status === 'completed' ? 'job-completed' : 'job-failed', 'dispatch', 'Job finished', {
        workerId: this.workerId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        status: outcome.status,
        durationMs: Date.now() - startedAt,
      });
      return {
        status: outcome.status,
        jobId: context.jobId,
        correlationId: context.correlationId,
        workerId: this.workerId,
        result: outcome.result,
        error: outcome.error,
      };
    } catch (error) {
      const workerError = error instanceof Error ? error : new WorkerExecutionError('Unknown worker execution failure', {
        workerId: this.workerId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        executionStage: 'dispatch',
        context: { queueName: this.queueName, jobType: context.job.jobType },
        recoveryRecommendation: 'Inspect the handler or queue context and retry the job after the underlying cause is resolved.',
      });
      await this.emit('job-failed', 'dispatch', 'Job failed', {
        workerId: this.workerId,
        jobId: context.jobId,
        correlationId: context.correlationId,
        error: workerError.message,
      });
      throw workerError;
    }
  }

  private async emit(type: string, stage: string, message: string, context?: Record<string, unknown>): Promise<void> {
    const event = { type, stage, message, context, timestamp: Date.now() };
    await this.hooks?.onWorkerStarted?.(event);
    await this.hooks?.onWorkerReady?.(event);
    await this.hooks?.onJobAccepted?.(event);
    await this.hooks?.onJobStarted?.(event);
    await this.hooks?.onJobCompleted?.(event);
    await this.hooks?.onJobFailed?.(event);
    await this.hooks?.onJobCancelled?.(event);
    await this.hooks?.onWorkerStopped?.(event);
  }
}
