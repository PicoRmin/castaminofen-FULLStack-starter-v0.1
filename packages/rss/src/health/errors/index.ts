export abstract class HealthError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly feedId: string | undefined;
  public readonly context: Record<string, unknown> | undefined;
  public readonly recovery: string | undefined;

  constructor(
    code: string,
    message: string,
    stage: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message);
    this.name = 'HealthError';
    this.code = code;
    this.stage = stage;
    this.feedId = feedId;
    this.context = context;
    this.recovery = recovery;
  }
}

export class HealthEvaluationError extends HealthError {
  constructor(
    message: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super('health-evaluation-error', message, 'evaluation', feedId, context, recovery);
    this.name = 'HealthEvaluationError';
  }
}

export class HealthScoringError extends HealthError {
  constructor(
    message: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super('health-scoring-error', message, 'scoring', feedId, context, recovery);
    this.name = 'HealthScoringError';
  }
}

export class HealthClassificationError extends HealthError {
  constructor(
    message: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super('health-classification-error', message, 'classification', feedId, context, recovery);
    this.name = 'HealthClassificationError';
  }
}

export class MetricCollectionError extends HealthError {
  constructor(
    message: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super('metric-collection-error', message, 'metrics', feedId, context, recovery);
    this.name = 'MetricCollectionError';
  }
}

export class HealthReportError extends HealthError {
  constructor(
    message: string,
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super('health-report-error', message, 'report', feedId, context, recovery);
    this.name = 'HealthReportError';
  }
}
