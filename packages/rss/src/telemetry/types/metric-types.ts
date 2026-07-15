export type TelemetryMetricKind = 'counter' | 'gauge' | 'histogram' | 'timer' | 'distribution' | 'rate' | 'custom';

export interface TelemetryDimensions {
  readonly [key: string]: string | number | boolean | undefined;
}

export interface TelemetryMetadata extends TelemetryDimensions {
  readonly correlationId?: string;
  readonly operationId?: string;
  readonly traceId?: string;
  readonly stage?: string;
  readonly feedId?: string;
}

export interface TelemetryMetricSample {
  readonly name: string;
  readonly kind: TelemetryMetricKind;
  readonly value: number;
  readonly timestamp: number;
  readonly metadata: Readonly<TelemetryMetadata> | undefined;
}

export interface TelemetryMetricSnapshot {
  readonly name: string;
  readonly kind: TelemetryMetricKind;
  readonly count: number;
  readonly sum: number;
  readonly average: number;
  readonly min: number;
  readonly max: number;
  readonly latest: number;
  readonly rate: number;
  readonly percentiles: Readonly<Record<string, number>>;
  readonly metadata: Readonly<TelemetryMetadata> | undefined;
}
