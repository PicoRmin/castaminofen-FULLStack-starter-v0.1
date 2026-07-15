import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { RetryMonitoringModel } from '../models/monitoring-models';

export class RetryMonitoringCollector implements MonitoringCollector<RetryMonitoringModel> {
  public readonly kind = 'retry';
  public readonly component = 'retry';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<RetryMonitoringModel> {
    const retry = input.retry as RetryMonitoringModel | undefined;
    if (!retry) {
      return {
        status: 'unknown',
        retryCount: 0,
        pendingRetries: 0,
        backoffMs: 0,
      };
    }

    return Object.freeze({
      status: retry.status,
      retryCount: retry.retryCount,
      pendingRetries: retry.pendingRetries,
      backoffMs: retry.backoffMs,
    });
  }
}
