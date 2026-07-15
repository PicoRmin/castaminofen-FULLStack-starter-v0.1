import type { TelemetryMetadata, TelemetryMetricSnapshot, TelemetryMetricSample } from '../types/metric-types';
import type { TelemetryEvent, TelemetryWarning } from '../events/telemetry-event';
import type { TelemetryTrace } from '../tracing/telemetry-trace';

export interface TelemetryMetricAggregator {
  aggregate(samples: readonly TelemetryMetricSample[]): TelemetryMetricSnapshot;
  merge(snapshots: readonly TelemetryMetricSnapshot[]): TelemetryMetricSnapshot | undefined;
}

export interface TelemetryExporter {
  readonly name: string;
  export(
    metrics: readonly TelemetryMetricSnapshot[],
    events: readonly TelemetryEvent[],
    traces: readonly TelemetryTrace[],
    warnings: readonly TelemetryWarning[],
  ): void | Promise<void>;
}

export interface TelemetryContext {
  readonly correlationId?: string;
  readonly operationId?: string;
  readonly traceId?: string;
  readonly stage?: string;
  readonly metadata?: Readonly<TelemetryMetadata>;
}

export interface TelemetrySpan {
  readonly id: string;
  readonly traceId: string;
  readonly operationId: string;
  readonly parentSpanId?: string;
  readonly name: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly status: 'ok' | 'error' | 'pending';
  end(): TelemetrySpan;
  recordMetric(name: string, value: number, metadata?: TelemetryMetadata): void;
  addAttribute(key: string, value: string | number | boolean): void;
}
