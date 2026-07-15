import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { TelemetryMonitoringModel } from '../models/monitoring-models';

export class TelemetryMonitoringCollector implements MonitoringCollector<TelemetryMonitoringModel> {
  public readonly kind = 'telemetry';
  public readonly component = 'telemetry';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<TelemetryMonitoringModel> {
    const telemetry = input.telemetry as TelemetryMonitoringModel | undefined;
    if (!telemetry) {
      return {
        sampleCount: 0,
        eventCount: 0,
        traceCount: 0,
      };
    }

    return Object.freeze({
      sampleCount: telemetry.sampleCount,
      eventCount: telemetry.eventCount,
      traceCount: telemetry.traceCount,
    });
  }
}
