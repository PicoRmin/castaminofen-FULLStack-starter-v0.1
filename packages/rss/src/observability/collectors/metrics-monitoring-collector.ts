import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { MetricsMonitoringModel } from '../models/monitoring-models';

export class MetricsMonitoringCollector implements MonitoringCollector<MetricsMonitoringModel> {
  public readonly kind = 'metrics';
  public readonly component = 'metrics';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<MetricsMonitoringModel> {
    const metrics = input.metrics as MetricsMonitoringModel | undefined;
    if (!metrics) {
      return {
        throughput: 0,
        saturation: 0,
        utilization: 0,
      };
    }

    return Object.freeze({
      throughput: metrics.throughput,
      saturation: metrics.saturation,
      utilization: metrics.utilization,
    });
  }
}
