import type { MonitoringCollector } from '../contracts/observability-contracts';
import { QueueMonitoringCollector } from './queue-monitoring-collector';
import { WorkerMonitoringCollector } from './worker-monitoring-collector';
import { JobMonitoringCollector } from './job-monitoring-collector';
import { TriggerMonitoringCollector } from './trigger-monitoring-collector';
import { SchedulerMonitoringCollector } from './scheduler-monitoring-collector';
import { RetryMonitoringCollector } from './retry-monitoring-collector';
import { RecoveryMonitoringCollector } from './recovery-monitoring-collector';
import { DeadLetterMonitoringCollector } from './dead-letter-monitoring-collector';
import { HealthMonitoringCollector } from './health-monitoring-collector';
import { MetricsMonitoringCollector } from './metrics-monitoring-collector';
import { TelemetryMonitoringCollector } from './telemetry-monitoring-collector';

export class CollectorFactory {
  public static createDefaultCollectors(): readonly MonitoringCollector[] {
    return Object.freeze([
      new QueueMonitoringCollector(),
      new WorkerMonitoringCollector(),
      new JobMonitoringCollector(),
      new TriggerMonitoringCollector(),
      new SchedulerMonitoringCollector(),
      new RetryMonitoringCollector(),
      new RecoveryMonitoringCollector(),
      new DeadLetterMonitoringCollector(),
      new HealthMonitoringCollector(),
      new MetricsMonitoringCollector(),
      new TelemetryMonitoringCollector(),
    ]);
  }
}
