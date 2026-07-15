import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { WorkerMonitoringModel } from '../models/monitoring-models';

export class WorkerMonitoringCollector implements MonitoringCollector<WorkerMonitoringModel> {
  public readonly kind = 'worker';
  public readonly component = 'worker';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<WorkerMonitoringModel> {
    const worker = input.worker as WorkerMonitoringModel | undefined;
    if (!worker) {
      return {
        status: 'unknown',
        count: 0,
        runningJobs: 0,
        idleWorkers: 0,
        busyWorkers: 0,
        averageExecutionTimeMs: 0,
        crashCount: 0,
        restartCount: 0,
        health: 'unknown',
        utilization: 0,
        capacity: 0,
      };
    }

    return Object.freeze({
      status: worker.status,
      count: worker.count,
      runningJobs: worker.runningJobs,
      idleWorkers: worker.idleWorkers,
      busyWorkers: worker.busyWorkers,
      averageExecutionTimeMs: worker.averageExecutionTimeMs,
      crashCount: worker.crashCount,
      restartCount: worker.restartCount,
      health: worker.health,
      utilization: worker.utilization,
      capacity: worker.capacity,
    });
  }
}
