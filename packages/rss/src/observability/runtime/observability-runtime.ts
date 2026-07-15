import { createObservabilityEvent } from '../events/observability-events';
import {
  CollectorFailure,
  ConfigurationFailure,
  DiagnosticsFailure,
  SnapshotFailure,
} from '../errors/observability-errors';
import type {
  MonitoringCollectorRegistry,
  ObservabilityRuntimeContract,
  ObservabilityRuntimeDependencies,
} from '../contracts/observability-contracts';
import { createObservabilitySnapshot, type MonitoringSnapshot } from '../models/monitoring-models';
import { CollectorFactory } from '../collectors/collector-factory';
import {
  createObservabilityContext,
  type ObservabilityContext,
} from '../context/observability-context';
import { DefaultDiagnosticsEngine } from '../diagnostics/default-diagnostics-engine';
import {
  createCollectionPolicy,
  type ObservabilityConfiguration,
} from '../types/observability-types';

export class ObservabilityRuntime implements ObservabilityRuntimeContract {
  private readonly collectorRegistry: MonitoringCollectorRegistry;
  private readonly diagnosticsEngine: DefaultDiagnosticsEngine;
  private readonly configuration: ObservabilityConfiguration;
  private readonly telemetry?: {
    readonly emitEvent?: (
      type: string,
      payload?: Record<string, unknown>,
      metadata?: Record<string, unknown>,
    ) => void;
  };

  public constructor(dependencies: ObservabilityRuntimeDependencies = {}) {
    this.collectorRegistry = dependencies.collectorRegistry ?? {
      register() {},
      get() {
        return undefined;
      },
      list() {
        return [];
      },
    };
    this.diagnosticsEngine =
      (dependencies.diagnosticsEngine as DefaultDiagnosticsEngine) ??
      new DefaultDiagnosticsEngine();
    this.configuration = dependencies.configuration ?? {};
    this.telemetry = dependencies.telemetry;

    for (const collector of CollectorFactory.createDefaultCollectors()) {
      this.collectorRegistry.register(collector);
    }
  }

  public async observe(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<MonitoringSnapshot> {
    const observationContext =
      context ?? createObservabilityContext({ component: 'unknown', resource: 'unknown' });
    const collectionPolicy = createCollectionPolicy(this.configuration);
    const event = createObservabilityEvent('ObservationStarted', {
      observationId: observationContext.observationId,
      correlationId: observationContext.correlationId,
      component: observationContext.component,
      resource: observationContext.resource,
      metadata: { inputKeys: Object.keys(input) },
    });
    this.emit(event);

    const snapshotInput: Record<string, unknown> = { ...input };
    const collectors = this.collectorRegistry.list();
    const results = new Map<string, unknown>();

    for (const collector of collectors) {
      try {
        this.emit(
          createObservabilityEvent('CollectorStarted', {
            observationId: observationContext.observationId,
            correlationId: observationContext.correlationId,
            component: collector.component,
            resource: observationContext.resource,
            metadata: { kind: collector.kind },
          }),
        );
        const result = await collector.collect(observationContext, snapshotInput);
        results.set(collector.kind, result);
        this.emit(
          createObservabilityEvent('CollectorCompleted', {
            observationId: observationContext.observationId,
            correlationId: observationContext.correlationId,
            component: collector.component,
            resource: observationContext.resource,
            metadata: { kind: collector.kind },
          }),
        );
      } catch (error) {
        throw new CollectorFailure(`Collector ${collector.kind} failed.`, {
          observationId: observationContext.observationId,
          component: collector.component,
          correlationId: observationContext.correlationId,
          collectionStage: 'collection',
          recoveryRecommendation: 'Inspect collector input and dependency contracts.',
          cause: error,
        });
      }
    }

    const snapshot = createObservabilitySnapshot({
      context: observationContext,
      queue: results.get('queue') as Parameters<typeof createObservabilitySnapshot>[0]['queue'],
      worker: results.get('worker') as Parameters<typeof createObservabilitySnapshot>[0]['worker'],
      job: results.get('job') as Parameters<typeof createObservabilitySnapshot>[0]['job'],
      trigger: results.get('trigger') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['trigger'],
      scheduler: results.get('scheduler') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['scheduler'],
      retry: results.get('retry') as Parameters<typeof createObservabilitySnapshot>[0]['retry'],
      recovery: results.get('recovery') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['recovery'],
      deadLetter: results.get('dead-letter') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['deadLetter'],
      health: results.get('health') as Parameters<typeof createObservabilitySnapshot>[0]['health'],
      metrics: results.get('metrics') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['metrics'],
      telemetry: results.get('telemetry') as Parameters<
        typeof createObservabilitySnapshot
      >[0]['telemetry'],
      collectionPolicy,
      events: [event],
    });

    let analyzedSnapshot: MonitoringSnapshot;
    try {
      analyzedSnapshot = this.diagnosticsEngine.analyze(snapshot);
    } catch (error) {
      throw new DiagnosticsFailure(`Diagnostics analysis failed.`, {
        observationId: observationContext.observationId,
        component: observationContext.component,
        correlationId: observationContext.correlationId,
        collectionStage: 'diagnostics',
        recoveryRecommendation: 'Review diagnostics inputs and fallback to basic metrics.',
        cause: error,
      });
    }

    if (!analyzedSnapshot.context) {
      throw new SnapshotFailure(`Snapshot creation failed.`, {
        observationId: observationContext.observationId,
        component: observationContext.component,
        correlationId: observationContext.correlationId,
        collectionStage: 'snapshot',
        recoveryRecommendation: 'Ensure the runtime produces a valid monitoring snapshot.',
      });
    }

    const completedEvent = createObservabilityEvent('ObservationCompleted', {
      observationId: observationContext.observationId,
      correlationId: observationContext.correlationId,
      component: observationContext.component,
      resource: observationContext.resource,
      metadata: { diagnostics: analyzedSnapshot.diagnostics ? 'available' : 'unavailable' },
    });
    this.emit(completedEvent);
    this.emit(
      createObservabilityEvent('SnapshotCreated', {
        observationId: observationContext.observationId,
        correlationId: observationContext.correlationId,
        component: observationContext.component,
        resource: observationContext.resource,
        metadata: {
          queue: Boolean(analyzedSnapshot.queue),
          worker: Boolean(analyzedSnapshot.worker),
          job: Boolean(analyzedSnapshot.job),
        },
      }),
    );
    return analyzedSnapshot;
  }

  public emit(event: Parameters<ObservabilityRuntimeContract['emit']>[0]): void {
    this.telemetry?.emitEvent?.(
      event.kind,
      {
        observationId: event.observationId,
        correlationId: event.correlationId,
        component: event.component,
        resource: event.resource,
        timestamp: event.timestamp,
        metadata: event.metadata,
      },
      event.metadata,
    );
  }
}
