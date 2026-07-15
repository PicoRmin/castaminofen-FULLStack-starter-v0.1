import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { QueueMonitoringModel } from '../models/monitoring-models';

export class QueueMonitoringCollector implements MonitoringCollector<QueueMonitoringModel> {
  public readonly kind = 'queue';
  public readonly component = 'queue';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<QueueMonitoringModel> {
    const queue = input.queue as QueueMonitoringModel | undefined;
    if (!queue) {
      return {
        name: 'unknown',
        status: 'unknown',
        length: 0,
        waitingJobs: 0,
        delayedJobs: 0,
        runningJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        retryQueue: 0,
        deadLetterQueue: 0,
        backpressure: 0,
        saturation: 0,
        capacity: 0,
        throughput: 0,
      };
    }

    return Object.freeze({
      name: queue.name,
      status: queue.status,
      length: queue.length,
      waitingJobs: queue.waitingJobs,
      delayedJobs: queue.delayedJobs,
      runningJobs: queue.runningJobs,
      completedJobs: queue.completedJobs,
      failedJobs: queue.failedJobs,
      retryQueue: queue.retryQueue,
      deadLetterQueue: queue.deadLetterQueue,
      backpressure: queue.backpressure,
      saturation: queue.saturation,
      capacity: queue.capacity,
      throughput: queue.throughput,
    });
  }
}
