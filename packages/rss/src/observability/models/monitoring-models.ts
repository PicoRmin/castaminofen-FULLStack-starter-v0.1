import type { ObservabilityContext } from '../context/observability-context';
import type { ObservabilityEvent } from '../events/observability-events';
import { DefaultDiagnosticsEngine } from '../diagnostics/default-diagnostics-engine';
import type { CollectionPolicy } from '../types/observability-types';

export interface QueueMonitoringModel {
  readonly name: string;
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly length: number;
  readonly waitingJobs: number;
  readonly delayedJobs: number;
  readonly runningJobs: number;
  readonly completedJobs: number;
  readonly failedJobs: number;
  readonly retryQueue: number;
  readonly deadLetterQueue: number;
  readonly backpressure: number;
  readonly saturation: number;
  readonly capacity: number;
  readonly throughput: number;
}

export interface WorkerMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly count: number;
  readonly runningJobs: number;
  readonly idleWorkers: number;
  readonly busyWorkers: number;
  readonly averageExecutionTimeMs: number;
  readonly crashCount: number;
  readonly restartCount: number;
  readonly health:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly utilization: number;
  readonly capacity: number;
}

export interface JobMonitoringModel {
  readonly state: string;
  readonly durationMs: number;
  readonly queueTimeMs: number;
  readonly executionTimeMs: number;
  readonly retryCount: number;
  readonly recoveryCount: number;
  readonly priority: string;
  readonly attempts: number;
  readonly cancellationRequested: boolean;
  readonly failureReason?: string | undefined;
  readonly completionTimeMs?: number | undefined;
  readonly correlationId: string;
}

export interface TriggerMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly count: number;
  readonly nextExecutionAt?: number | undefined;
  readonly previousExecutionAt?: number | undefined;
  readonly skippedTriggers: number;
  readonly delayedTriggers: number;
  readonly cancelledTriggers: number;
  readonly expiredTriggers: number;
}

export interface SchedulerMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly triggerCount: number;
  readonly activeTriggers: number;
  readonly nextExecutionAt?: number | undefined;
  readonly previousExecutionAt?: number | undefined;
}

export interface RetryMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly retryCount: number;
  readonly pendingRetries: number;
  readonly backoffMs: number;
}

export interface RecoveryMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly recoveryCount: number;
  readonly pendingRecoveries: number;
  readonly lastRecoveryAt?: number | undefined;
}

export interface DeadLetterMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly count: number;
  readonly oldestAgeMs: number;
}

export interface HealthMonitoringModel {
  readonly status:
    | 'unknown'
    | 'active'
    | 'idle'
    | 'ready'
    | 'healthy'
    | 'warning'
    | 'critical'
    | 'degraded'
    | 'stopped'
    | 'failed';
  readonly score: number;
}

export interface MetricsMonitoringModel {
  readonly throughput: number;
  readonly saturation: number;
  readonly utilization: number;
}

export interface TelemetryMonitoringModel {
  readonly sampleCount: number;
  readonly eventCount: number;
  readonly traceCount: number;
}

export interface DiagnosticsModel {
  readonly failureAnalysis: {
    readonly failureCount: number;
    readonly failureRate: number;
    readonly lastFailureReason?: string | undefined;
  };
  readonly recoveryAnalysis: {
    readonly recoveryCount: number;
    readonly recoveryRate: number;
  };
  readonly retryAnalysis: {
    readonly retryCount: number;
    readonly averageRetryCount: number;
  };
  readonly queueDiagnostics: {
    readonly queueHealth: number;
    readonly queueSaturation: number;
  };
  readonly workerDiagnostics: {
    readonly workerHealth: number;
    readonly workerUtilization: number;
  };
  readonly schedulerDiagnostics: {
    readonly schedulerHealth: number;
    readonly pendingTriggers: number;
  };
  readonly latencyAnalysis: {
    readonly averageQueueTimeMs: number;
    readonly averageExecutionTimeMs: number;
  };
  readonly capacityAnalysis: {
    readonly concurrencyLevel: number;
    readonly backpressureLevel: number;
    readonly workerUtilization: number;
  };
  readonly throughputAnalysis: {
    readonly processingThroughput: number;
    readonly historicalTrend: number;
  };
  readonly bottleneckDetection: {
    readonly bottleneckDetected: boolean;
    readonly bottleneckScore: number;
  };
}

export interface MonitoringSnapshot {
  readonly context: ObservabilityContext;
  readonly queue?: QueueMonitoringModel | undefined;
  readonly worker?: WorkerMonitoringModel | undefined;
  readonly job?: JobMonitoringModel | undefined;
  readonly trigger?: TriggerMonitoringModel | undefined;
  readonly scheduler?: SchedulerMonitoringModel | undefined;
  readonly retry?: RetryMonitoringModel | undefined;
  readonly recovery?: RecoveryMonitoringModel | undefined;
  readonly deadLetter?: DeadLetterMonitoringModel | undefined;
  readonly health?: HealthMonitoringModel | undefined;
  readonly metrics?: MetricsMonitoringModel | undefined;
  readonly telemetry?: TelemetryMonitoringModel | undefined;
  readonly diagnostics?: DiagnosticsModel | undefined;
  readonly events: readonly ObservabilityEvent[];
  readonly createdAt: number;
  readonly collectionPolicy: CollectionPolicy;
}

export function createObservabilitySnapshot(input: {
  readonly context: ObservabilityContext;
  readonly queue?: QueueMonitoringModel | undefined;
  readonly worker?: WorkerMonitoringModel | undefined;
  readonly job?: JobMonitoringModel | undefined;
  readonly trigger?: TriggerMonitoringModel | undefined;
  readonly scheduler?: SchedulerMonitoringModel | undefined;
  readonly retry?: RetryMonitoringModel | undefined;
  readonly recovery?: RecoveryMonitoringModel | undefined;
  readonly deadLetter?: DeadLetterMonitoringModel | undefined;
  readonly health?: HealthMonitoringModel | undefined;
  readonly metrics?: MetricsMonitoringModel | undefined;
  readonly telemetry?: TelemetryMonitoringModel | undefined;
  readonly diagnostics?: DiagnosticsModel | undefined;
  readonly events?: readonly ObservabilityEvent[];
  readonly createdAt?: number;
  readonly collectionPolicy?: CollectionPolicy;
}): MonitoringSnapshot {
  const snapshot = Object.freeze({
    context: input.context,
    queue: input.queue,
    worker: input.worker,
    job: input.job,
    trigger: input.trigger,
    scheduler: input.scheduler,
    retry: input.retry,
    recovery: input.recovery,
    deadLetter: input.deadLetter,
    health: input.health,
    metrics: input.metrics,
    telemetry: input.telemetry,
    diagnostics: input.diagnostics,
    events: Object.freeze([...(input.events ?? [])]),
    createdAt: input.createdAt ?? Date.now(),
    collectionPolicy:
      input.collectionPolicy ?? (input.context.collectionPolicy as CollectionPolicy),
  });

  const diagnosticsEngine = new DefaultDiagnosticsEngine();
  return diagnosticsEngine.analyze(snapshot);
}
