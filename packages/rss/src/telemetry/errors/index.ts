export abstract class TelemetryError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly metric: string | undefined;
  public readonly traceId: string | undefined;
  public readonly context: Readonly<Record<string, unknown>> | undefined;
  public readonly recoveryRecommendation: string | undefined;

  constructor(
    code: string,
    message: string,
    stage: string,
    metric?: string,
    traceId?: string,
    context?: Record<string, unknown>,
    recoveryRecommendation?: string,
  ) {
    super(message);
    this.name = 'TelemetryError';
    this.code = code;
    this.stage = stage;
    this.metric = metric;
    this.traceId = traceId;
    this.context = context ? Object.freeze({ ...context }) : undefined;
    this.recoveryRecommendation = recoveryRecommendation;
  }
}

export class TelemetryCollectionError extends TelemetryError {
  constructor(message: string, metric?: string, traceId?: string, context?: Record<string, unknown>, recoveryRecommendation?: string) {
    super('telemetry-collection-error', message, 'collect', metric, traceId, context, recoveryRecommendation);
    this.name = 'TelemetryCollectionError';
  }
}

export class MetricAggregationError extends TelemetryError {
  constructor(message: string, metric?: string, traceId?: string, context?: Record<string, unknown>, recoveryRecommendation?: string) {
    super('metric-aggregation-error', message, 'aggregate', metric, traceId, context, recoveryRecommendation);
    this.name = 'MetricAggregationError';
  }
}

export class TraceCreationError extends TelemetryError {
  constructor(message: string, metric?: string, traceId?: string, context?: Record<string, unknown>, recoveryRecommendation?: string) {
    super('trace-creation-error', message, 'trace', metric, traceId, context, recoveryRecommendation);
    this.name = 'TraceCreationError';
  }
}

export class ExporterError extends TelemetryError {
  constructor(message: string, metric?: string, traceId?: string, context?: Record<string, unknown>, recoveryRecommendation?: string) {
    super('exporter-error', message, 'export', metric, traceId, context, recoveryRecommendation);
    this.name = 'ExporterError';
  }
}

export class TelemetryContextError extends TelemetryError {
  constructor(message: string, metric?: string, traceId?: string, context?: Record<string, unknown>, recoveryRecommendation?: string) {
    super('telemetry-context-error', message, 'context', metric, traceId, context, recoveryRecommendation);
    this.name = 'TelemetryContextError';
  }
}
