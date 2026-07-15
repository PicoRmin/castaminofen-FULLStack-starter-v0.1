import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringCollector } from '../contracts/observability-contracts';
import type { RecoveryMonitoringModel } from '../models/monitoring-models';

export class RecoveryMonitoringCollector implements MonitoringCollector<RecoveryMonitoringModel> {
  public readonly kind = 'recovery';
  public readonly component = 'recovery';

  public async collect(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<RecoveryMonitoringModel> {
    const recovery = input.recovery as RecoveryMonitoringModel | undefined;
    if (!recovery) {
      return {
        status: 'unknown',
        recoveryCount: 0,
        pendingRecoveries: 0,
      };
    }

    return Object.freeze({
      status: recovery.status,
      recoveryCount: recovery.recoveryCount,
      pendingRecoveries: recovery.pendingRecoveries,
      lastRecoveryAt: recovery.lastRecoveryAt,
    });
  }
}
