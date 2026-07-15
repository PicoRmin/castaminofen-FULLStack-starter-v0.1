import type { ObservabilityContext } from '../context/observability-context';
import type { MonitoringSnapshot } from '../models/monitoring-models';
import { createObservabilitySnapshot } from '../models/monitoring-models';
import { createCollectionPolicy, type CollectionPolicy } from '../types/observability-types';

export class SnapshotBuilder {
  public build(input: {
    readonly context: ObservabilityContext;
    readonly queue?: MonitoringSnapshot['queue'];
    readonly worker?: MonitoringSnapshot['worker'];
    readonly job?: MonitoringSnapshot['job'];
    readonly trigger?: MonitoringSnapshot['trigger'];
    readonly scheduler?: MonitoringSnapshot['scheduler'];
    readonly retry?: MonitoringSnapshot['retry'];
    readonly recovery?: MonitoringSnapshot['recovery'];
    readonly deadLetter?: MonitoringSnapshot['deadLetter'];
    readonly health?: MonitoringSnapshot['health'];
    readonly metrics?: MonitoringSnapshot['metrics'];
    readonly telemetry?: MonitoringSnapshot['telemetry'];
    readonly diagnostics?: MonitoringSnapshot['diagnostics'];
    readonly events?: readonly MonitoringSnapshot['events'];
    readonly collectionPolicy?: CollectionPolicy;
  }): MonitoringSnapshot {
    return createObservabilitySnapshot({
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
      events: input.events,
      collectionPolicy: input.collectionPolicy ?? createCollectionPolicy(),
    });
  }
}
