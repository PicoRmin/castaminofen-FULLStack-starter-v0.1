import test from 'node:test';
import assert from 'node:assert/strict';
import { ObservabilityRuntime } from '../runtime/observability-runtime';
import { DefaultCollectorRegistry } from '../collectors/collector-registry';
import { DefaultDiagnosticsEngine } from '../diagnostics/default-diagnostics-engine';
import { createObservabilityContext } from '../context/observability-context';
import { createObservabilitySnapshot } from '../models/monitoring-models';
import type { QueueJobEnvelope } from '../../queue/contracts/queue-job-contract';

test('observability runtime collects queue and worker snapshots without mutating state', async () => {
  const registry = new DefaultCollectorRegistry();
  const diagnostics = new DefaultDiagnosticsEngine();
  const runtime = new ObservabilityRuntime({
    collectorRegistry: registry,
    diagnosticsEngine: diagnostics,
  });

  const context = createObservabilityContext({
    component: 'queue',
    resource: 'rss:import',
    correlationId: 'corr-observe-1',
    metadata: { environment: 'test' },
  });

  const job: QueueJobEnvelope = {
    jobId: 'job-obs-1',
    jobType: 'import',
    correlationId: 'corr-observe-1',
    feedId: 'feed-1',
    priority: 'normal',
    queueName: 'import',
    payload: { url: 'https://example.com/feed.xml' },
    metadata: { source: 'test' },
    creationTime: Date.now(),
    retryPolicy: { attempts: 3, backoffMs: 100, maxDelayMs: 1000, strategy: 'fixed' },
    timeoutMs: 5000,
    version: 1,
    state: 'queued',
  };

  const snapshot = await runtime.observe(context, {
    queue: {
      name: 'import',
      status: 'active',
      length: 1,
      waitingJobs: 1,
      delayedJobs: 0,
      runningJobs: 0,
      completedJobs: 1,
      failedJobs: 0,
      retryQueue: 0,
      deadLetterQueue: 0,
      backpressure: 0,
      saturation: 0.1,
      capacity: 10,
      throughput: 2,
    },
    worker: {
      status: 'ready',
      count: 2,
      runningJobs: 1,
      idleWorkers: 1,
      busyWorkers: 1,
      averageExecutionTimeMs: 120,
      crashCount: 0,
      restartCount: 0,
      health: 'healthy',
      utilization: 0.5,
      capacity: 2,
    },
    job: {
      state: 'queued',
      durationMs: 15,
      queueTimeMs: 10,
      executionTimeMs: 5,
      retryCount: 0,
      recoveryCount: 0,
      priority: 'normal',
      attempts: 1,
      cancellationRequested: false,
      failureReason: undefined,
      completionTimeMs: undefined,
      correlationId: job.correlationId,
    },
    trigger: undefined,
    scheduler: undefined,
    retry: undefined,
    recovery: undefined,
    deadLetter: undefined,
    health: undefined,
    metrics: undefined,
    telemetry: undefined,
  });

  assert.ok(snapshot);
  assert.equal(snapshot.context.observationId, context.observationId);
  assert.equal(snapshot.queue?.status, 'active');
  assert.equal(snapshot.worker?.status, 'ready');
  assert.equal(snapshot.job?.correlationId, 'corr-observe-1');
  assert.equal(snapshot.diagnostics?.throughputAnalysis.processingThroughput, 2);
  assert.equal(snapshot.diagnostics?.latencyAnalysis.averageQueueTimeMs, 10);
  assert.equal(snapshot.diagnostics?.capacityAnalysis.workerUtilization, 0.5);
  assert.equal(snapshot.context.metadata.environment, 'test');
  assert.equal(snapshot.context.version, 1);
  assert.equal(typeof snapshot.createdAt, 'number');
  assert.equal(snapshot.job?.state, 'queued');
  assert.equal(snapshot.queue?.waitingJobs, 1);
});

test('snapshot factory creates immutable monitoring snapshots', () => {
  const snapshot = createObservabilitySnapshot({
    context: createObservabilityContext({ component: 'scheduler', resource: 'rss:scheduler' }),
    queue: undefined,
    worker: undefined,
    job: undefined,
    trigger: undefined,
    scheduler: undefined,
    retry: undefined,
    recovery: undefined,
    deadLetter: undefined,
    health: undefined,
    metrics: undefined,
    telemetry: undefined,
  });

  assert.equal(snapshot.context.component, 'scheduler');
  assert.equal(snapshot.context.version, 1);
  assert.equal(snapshot.diagnostics?.bottleneckDetection.bottleneckDetected, false);
});
