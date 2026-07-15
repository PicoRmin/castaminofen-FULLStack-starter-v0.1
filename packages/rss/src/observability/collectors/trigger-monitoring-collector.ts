import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { TriggerMonitoringModel } from '../models/monitoring-models';

export class TriggerMonitoringCollector implements MonitoringCollector<TriggerMonitoringModel> {
  public readonly kind = 'trigger';
  public readonly component = 'trigger';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<TriggerMonitoringModel> {
    const trigger = input.trigger as TriggerMonitoringModel | undefined;
    if (!trigger) {
      return {
        status: 'unknown',
        count: 0,
        skippedTriggers: 0,
        delayedTriggers: 0,
        cancelledTriggers: 0,
        expiredTriggers: 0,
      };
    }

    return Object.freeze({
      status: trigger.status,
      count: trigger.count,
      nextExecutionAt: trigger.nextExecutionAt,
      previousExecutionAt: trigger.previousExecutionAt,
      skippedTriggers: trigger.skippedTriggers,
      delayedTriggers: trigger.delayedTriggers,
      cancelledTriggers: trigger.cancelledTriggers,
      expiredTriggers: trigger.expiredTriggers,
    });
  }
}
