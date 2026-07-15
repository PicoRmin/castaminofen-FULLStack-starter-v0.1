import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { JobMonitoringModel } from '../models/monitoring-models';

export class JobMonitoringCollector implements MonitoringCollector<JobMonitoringModel> {
  public readonly kind = 'job';
  public readonly component = 'job';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<JobMonitoringModel> {
    const job = input.job as JobMonitoringModel | undefined;
    if (!job) {
      return {
        state: 'unknown',
        durationMs: 0,
        queueTimeMs: 0,
        executionTimeMs: 0,
        retryCount: 0,
        recoveryCount: 0,
        priority: 'unknown',
        attempts: 0,
        cancellationRequested: false,
        correlationId: context.correlationId,
      };
    }

    return Object.freeze({
      state: job.state,
      durationMs: job.durationMs,
      queueTimeMs: job.queueTimeMs,
      executionTimeMs: job.executionTimeMs,
      retryCount: job.retryCount,
      recoveryCount: job.recoveryCount,
      priority: job.priority,
      attempts: job.attempts,
      cancellationRequested: job.cancellationRequested,
      failureReason: job.failureReason,
      completionTimeMs: job.completionTimeMs,
      correlationId: job.correlationId,
    });
  }
}
