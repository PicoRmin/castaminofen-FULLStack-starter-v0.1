import type { ObservabilityContext } from '../context/observability-context';
import type { ObservabilityEvent } from '../events/observability-events';
import type { MonitoringSnapshot } from '../models/monitoring-models';
import type { ObservabilityConfiguration } from '../types/observability-types';

export interface MonitoringCollector<TValue = unknown> {
  readonly kind: string;
  readonly component: string;
  collect(context: ObservabilityContext, input: Record<string, unknown>): Promise<TValue>;
}

export interface MonitoringProvider<TValue = unknown> {
  readonly name: string;
  readonly kind: string;
  create(context: ObservabilityContext, input: Record<string, unknown>): Promise<TValue>;
}

export interface DiagnosticsEngine {
  analyze(snapshot: MonitoringSnapshot): MonitoringSnapshot;
}

export interface ObservabilityRuntimeDependencies {
  readonly collectorRegistry?: MonitoringCollectorRegistry;
  readonly diagnosticsEngine?: DiagnosticsEngine;
  readonly configuration?: ObservabilityConfiguration;
  readonly telemetry?: {
    readonly emitEvent?: (
      type: string,
      payload?: Record<string, unknown>,
      metadata?: Record<string, unknown>,
    ) => void;
  };
}

export interface MonitoringCollectorRegistry {
  register(collector: MonitoringCollector): void;
  get(kind: string): MonitoringCollector | undefined;
  list(): readonly MonitoringCollector[];
}

export interface ObservabilityRuntimeContract {
  observe(
    context: ObservabilityContext,
    input: Record<string, unknown>,
  ): Promise<MonitoringSnapshot>;
  emit(event: ObservabilityEvent): void;
}
