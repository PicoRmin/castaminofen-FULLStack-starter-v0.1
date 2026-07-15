import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { DeadLetterMonitoringModel } from '../models/monitoring-models';

export class DeadLetterMonitoringCollector implements MonitoringCollector<DeadLetterMonitoringModel> {
  public readonly kind = 'dead-letter';
  public readonly component = 'dead-letter';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<DeadLetterMonitoringModel> {
    const deadLetter = input.deadLetter as DeadLetterMonitoringModel | undefined;
    if (!deadLetter) {
      return {
        status: 'unknown',
        count: 0,
        oldestAgeMs: 0,
      };
    }

    return Object.freeze({
      status: deadLetter.status,
      count: deadLetter.count,
      oldestAgeMs: deadLetter.oldestAgeMs,
    });
  }
}
