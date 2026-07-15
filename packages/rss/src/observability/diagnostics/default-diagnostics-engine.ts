import type { DiagnosticsEngine } from '../contracts/observability-contracts';
import type { DiagnosticsModel, MonitoringSnapshot } from '../models/monitoring-models';

export class DefaultDiagnosticsEngine implements DiagnosticsEngine {
  public analyze(snapshot: MonitoringSnapshot): MonitoringSnapshot {
    const queue = snapshot.queue;
    const worker = snapshot.worker;
    const job = snapshot.job;
    const retry = snapshot.retry;
    const recovery = snapshot.recovery;

    const failureCount =
      queue && queue.failedJobs > 0 ? queue.failedJobs : job && job.state === 'failed' ? 1 : 0;
    const recoveryCount = recovery?.recoveryCount ?? 0;
    const retryCount = retry?.retryCount ?? 0;
    const averageQueueTimeMs = job?.queueTimeMs ?? 0;
    const averageExecutionTimeMs = job?.executionTimeMs ?? 0;
    const workerUtilization = worker?.utilization ?? 0;
    const queueSaturation = queue?.saturation ?? 0;
    const concurrencyLevel = worker?.count > 0 ? worker.count : 1;
    const backpressureLevel = queue?.backpressure ?? 0;
    const processingThroughput = queue?.throughput ?? 0;
    const historicalTrend = processingThroughput > 0 ? processingThroughput : 0;
    const bottleneckDetected = queueSaturation > 0.8 || workerUtilization > 0.9;

    const diagnostics: DiagnosticsModel = Object.freeze({
      failureAnalysis: Object.freeze({
        failureCount,
        failureRate: failureCount > 0 ? 1 : 0,
        lastFailureReason: job?.failureReason,
      }),
      recoveryAnalysis: Object.freeze({
        recoveryCount,
        recoveryRate: recoveryCount > 0 ? 1 : 0,
      }),
      retryAnalysis: Object.freeze({
        retryCount,
        averageRetryCount: retryCount > 0 ? retryCount : 0,
      }),
      queueDiagnostics: Object.freeze({
        queueHealth: queue ? 1 - queueSaturation : 1,
        queueSaturation,
      }),
      workerDiagnostics: Object.freeze({
        workerHealth: worker ? 1 - workerUtilization : 1,
        workerUtilization,
      }),
      schedulerDiagnostics: Object.freeze({
        schedulerHealth: 1,
        pendingTriggers: 0,
      }),
      latencyAnalysis: Object.freeze({
        averageQueueTimeMs,
        averageExecutionTimeMs,
      }),
      capacityAnalysis: Object.freeze({
        concurrencyLevel,
        backpressureLevel,
        workerUtilization,
      }),
      throughputAnalysis: Object.freeze({
        processingThroughput,
        historicalTrend,
      }),
      bottleneckDetection: Object.freeze({
        bottleneckDetected,
        bottleneckScore: bottleneckDetected ? 1 : 0,
      }),
    });

    return Object.freeze({
      ...snapshot,
      diagnostics,
    }) as MonitoringSnapshot;
  }
}
