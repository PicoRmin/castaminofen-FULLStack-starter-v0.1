export class SchedulerError extends Error {
  public readonly schedulerId: string | undefined;
  public readonly triggerId: string | undefined;
  public readonly correlationId: string | undefined;
  public readonly policyId: string | undefined;
  public readonly executionStage: string;
  public readonly recoveryRecommendation: string | undefined;
  public readonly context: Readonly<Record<string, unknown>> | undefined;

  public constructor(message: string, details: Partial<SchedulerErrorDetails> = {}) {
    super(message);
    this.name = 'SchedulerError';
    this.schedulerId = details.schedulerId;
    this.triggerId = details.triggerId;
    this.correlationId = details.correlationId;
    this.policyId = details.policyId;
    this.executionStage = details.executionStage ?? 'unknown';
    this.recoveryRecommendation = details.recoveryRecommendation;
    this.context = details.context ? Object.freeze({ ...details.context }) : undefined;
  }
}

export interface SchedulerErrorDetails {
  readonly schedulerId?: string;
  readonly triggerId?: string;
  readonly correlationId?: string;
  readonly policyId?: string;
  readonly executionStage?: string;
  readonly recoveryRecommendation?: string;
  readonly context?: Record<string, unknown>;
}

export class SchedulerConfigurationError extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'SchedulerConfigurationError';
  }
}

export class InvalidCronExpression extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'InvalidCronExpression';
  }
}

export class InvalidSchedulingPolicy extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'InvalidSchedulingPolicy';
  }
}

export class TriggerDispatchError extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'TriggerDispatchError';
  }
}

export class ScheduleConflictError extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'ScheduleConflictError';
  }
}

export class TimeProviderError extends SchedulerError {
  public constructor(message: string, details: SchedulerErrorDetails = {}) {
    super(message, details);
    this.name = 'TimeProviderError';
  }
}
