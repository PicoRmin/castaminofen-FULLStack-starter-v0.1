export * from './errors';
export * from './events/telemetry-event';
export * from './exporters';
export * from './interfaces';
export * from './metrics/metric-aggregator';
export * from './tracing/telemetry-trace';
export * from './types/metric-types';

import { createTelemetryEvent, createTelemetryWarning } from './events/telemetry-event';
import { DefaultTelemetryMetricAggregator } from './metrics/metric-aggregator';
import { TelemetryTraceSpan } from './tracing/telemetry-trace';
import type { TelemetryContext, TelemetryExporter, TelemetrySpan } from './interfaces';
import type { TelemetryMetadata, TelemetryMetricSample, TelemetryMetricSnapshot } from './types/metric-types';
import type { TelemetryTrace } from './tracing/telemetry-trace';
import { TelemetryCollectionError, TelemetryContextError, ExporterError } from './errors';

export interface SynchronizationTelemetryOptions {
  readonly exporters?: readonly TelemetryExporter[];
  readonly maxSamples?: number;
  readonly aggregator?: DefaultTelemetryMetricAggregator;
}

export interface SynchronizationTelemetrySnapshot {
  readonly metrics: readonly TelemetryMetricSnapshot[];
  readonly events: readonly TelemetryEvent[];
  readonly traces: readonly TelemetryTrace[];
  readonly warnings: readonly TelemetryWarning[];
}

export class SynchronizationTelemetry {
  private readonly samples = new Map<string, TelemetryMetricSample[]>();
  private readonly events: Array<ReturnType<typeof createTelemetryEvent>> = [];
  private readonly traces: TelemetryTraceSpan[] = [];
  private readonly warnings: Array<ReturnType<typeof createTelemetryWarning>> = [];
  private readonly exporters: readonly TelemetryExporter[];
  private readonly aggregator: DefaultTelemetryMetricAggregator;
  private readonly maxSamples: number;

  constructor(options: SynchronizationTelemetryOptions = {}) {
    this.exporters = options.exporters ?? [];
    this.aggregator = options.aggregator ?? new DefaultTelemetryMetricAggregator();
    this.maxSamples = options.maxSamples ?? 1000;
  }

  public recordMetric(name: string, value: number, metadata?: TelemetryMetadata): void {
    if (!Number.isFinite(value)) {
      throw new TelemetryCollectionError('Metric value must be finite.', name, metadata?.traceId, metadata);
    }

    const sample: TelemetryMetricSample = Object.freeze({
      name,
      kind: 'counter',
      value,
      timestamp: Date.now(),
      metadata: metadata ? Object.freeze({ ...metadata }) : undefined,
    });

    const existing = this.samples.get(name) ?? [];
    existing.push(sample);
    if (existing.length > this.maxSamples) {
      existing.splice(0, existing.length - this.maxSamples);
      this.warnings.push(createTelemetryWarning('metric-overflow', 'Metric sample buffer overflowed.', 'collect', metadata));
    }
    this.samples.set(name, existing);
  }

  public emitEvent(type: string, payload: Record<string, unknown> = {}, metadata?: TelemetryMetadata): void {
    if (!type.trim()) {
      throw new TelemetryContextError('Event type is required.', undefined, metadata?.traceId, { payload, metadata });
    }
    const event = createTelemetryEvent(type, payload, metadata);
    this.events.push(event);
  }

  public startTrace(name: string, context?: TelemetryContext): TelemetrySpan {
    if (!name.trim()) {
      throw new TelemetryContextError('Trace name is required.', undefined, context?.traceId, { context });
    }

    const traceId = context?.traceId ?? this.createId('trace');
    const operationId = context?.operationId ?? this.createId('op');
    const spanId = this.createId('span');
    const span = new TelemetryTraceSpan(spanId, traceId, operationId, name, Date.now(), context?.metadata?.traceId, () => {
      this.traces.push(span);
    }, context?.metadata);
    return span;
  }

  public snapshot(): SynchronizationTelemetrySnapshot {
    const metrics = Array.from(this.samples.entries()).map(([name, samples]) => this.aggregator.aggregate(samples));
    return Object.freeze({
      metrics: Object.freeze(metrics),
      events: Object.freeze([...this.events]),
      traces: Object.freeze(this.traces.map((trace) => trace.toSnapshot())),
      warnings: Object.freeze([...this.warnings]),
    });
  }

  public async flush(): Promise<void> {
    const snapshot = this.snapshot();
    const exportTasks = this.exporters.map(async (exporter) => {
      try {
        await exporter.export(snapshot.metrics, snapshot.events, snapshot.traces as unknown as never[], snapshot.warnings);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Exporter failed.';
        throw new ExporterError(message, undefined, undefined, { exporter: exporter.name }, 'Retry export after confirming exporter availability.');
      }
    });

    await Promise.all(exportTasks);
  }

  private createId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
