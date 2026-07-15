export interface ObservabilityErrorDetails {
  readonly observationId: string;
  readonly component: string;
  readonly correlationId: string;
  readonly collectionStage: string;
  readonly recoveryRecommendation: string;
  readonly cause?: unknown;
}

export class ObservabilityError extends Error {
  public readonly observationId: string;
  public readonly component: string;
  public readonly correlationId: string;
  public readonly collectionStage: string;
  public readonly recoveryRecommendation: string;
  public readonly cause: unknown;

  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message);
    this.name = 'ObservabilityError';
    this.observationId = details.observationId;
    this.component = details.component;
    this.correlationId = details.correlationId;
    this.collectionStage = details.collectionStage;
    this.recoveryRecommendation = details.recoveryRecommendation;
    this.cause = details.cause;
  }
}

export class CollectorFailure extends ObservabilityError {
  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message, details);
    this.name = 'CollectorFailure';
  }
}

export class DiagnosticsFailure extends ObservabilityError {
  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message, details);
    this.name = 'DiagnosticsFailure';
  }
}

export class SnapshotFailure extends ObservabilityError {
  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message, details);
    this.name = 'SnapshotFailure';
  }
}

export class ConfigurationFailure extends ObservabilityError {
  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message, details);
    this.name = 'ConfigurationFailure';
  }
}

export class MonitoringProviderFailure extends ObservabilityError {
  public constructor(message: string, details: ObservabilityErrorDetails) {
    super(message, details);
    this.name = 'MonitoringProviderFailure';
  }
}
