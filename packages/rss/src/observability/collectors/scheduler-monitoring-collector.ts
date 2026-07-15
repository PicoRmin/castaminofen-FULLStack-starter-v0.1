import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { SchedulerMonitoringModel } from '../models/monitoring-models';

export class SchedulerMonitoringCollector implements MonitoringCollector<SchedulerMonitoringModel> {
  public readonly kind = 'scheduler';
  public readonly component = 'scheduler';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<SchedulerMonitoringModel> {
    const scheduler = input.scheduler as SchedulerMonitoringModel | undefined;
    if (!scheduler) {
      return {
        status: 'unknown',
        triggerCount: 0,
        activeTriggers: 0,
      };
    }

    return Object.freeze({
      status: scheduler.status,
      triggerCount: scheduler.triggerCount,
      activeTriggers: scheduler.activeTriggers,
      nextExecutionAt: scheduler.nextExecutionAt,
      previousExecutionAt: scheduler.previousExecutionAt,
    });
  }
}
