import type { JobContext } from '../context/job-context';
import type { SynchronizationTelemetry } from '../../telemetry';

export interface MetricsCollectionJobHandlerDependencies {
  readonly telemetry: SynchronizationTelemetry;
}

export class MetricsCollectionJobHandler {
  private readonly telemetry: SynchronizationTelemetry;

  public constructor(dependencies: MetricsCollectionJobHandlerDependencies) {
    this.telemetry = dependencies.telemetry;
  }

  public async execute(context: JobContext): Promise<unknown> {
    this.telemetry.recordMetric('worker.job.completed', 1, { traceId: context.correlationId, operationId: context.executionId });
    return { ok: true, jobId: context.jobId, telemetry: 'recorded' };
  }
}
