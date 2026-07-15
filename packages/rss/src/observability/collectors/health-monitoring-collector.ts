import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { HealthMonitoringModel } from '../models/monitoring-models';

export class HealthMonitoringCollector implements MonitoringCollector<HealthMonitoringModel> {
  public readonly kind = 'health';
  public readonly component = 'health';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<HealthMonitoringModel> {
    const health = input.health as HealthMonitoringModel | undefined;
    if (!health) {
      return {
        status: 'unknown',
        score: 0,
      };
    }

    return Object.freeze({
      status: health.status,
      score: health.score,
    });
  }
}
