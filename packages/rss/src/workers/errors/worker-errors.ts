export interface WorkerErrorDetails {
  readonly workerId: string;
  readonly jobId?: string | undefined;
  readonly correlationId?: string | undefined;
  readonly executionStage: string;
  readonly context?: Readonly<Record<string, unknown>> | undefined;
  readonly recoveryRecommendation: string;
}

export class WorkerError extends Error {
  public readonly workerId: string;
  public readonly jobId?: string | undefined;
  public readonly correlationId?: string | undefined;
  public readonly executionStage: string;
  public readonly context?: Readonly<Record<string, unknown>> | undefined;
  public readonly recoveryRecommendation: string;

  public constructor(message: string, details: WorkerErrorDetails) {
    super(message);
    this.name = 'WorkerError';
    this.workerId = details.workerId;
    this.jobId = details.jobId;
    this.correlationId = details.correlationId;
    this.executionStage = details.executionStage;
    this.context = details.context;
    this.recoveryRecommendation = details.recoveryRecommendation;
  }
}

export class WorkerInitializationError extends WorkerError {
  public constructor(message: string, details: WorkerErrorDetails) {
    super(message, details);
    this.name = 'WorkerInitializationError';
  }
}

export class WorkerExecutionError extends WorkerError {
  public constructor(message: string, details: WorkerErrorDetails) {
    super(message, details);
    this.name = 'WorkerExecutionError';
  }
}

export class JobDispatchError extends WorkerError {
  public constructor(message: string, details: WorkerErrorDetails) {
    super(message, details);
    this.name = 'JobDispatchError';
  }
}

export class HandlerResolutionError extends WorkerError {
  public constructor(message: string, details: WorkerErrorDetails) {
    super(message, details);
    this.name = 'HandlerResolutionError';
  }
}

export class WorkerShutdownError extends WorkerError {
  public constructor(message: string, details: WorkerErrorDetails) {
    super(message, details);
    this.name = 'WorkerShutdownError';
  }
}
