export class DeduplicationError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly cause: unknown;
  public readonly recovery: string | undefined;

  constructor(code: string, message: string, stage: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super(message);
    this.name = 'DeduplicationError';
    this.code = code;
    this.stage = stage;
    this.context = context;
    this.cause = cause;
    this.recovery = recovery;
  }
}

export class DuplicateDetectionError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('duplicate-detection-error', message, 'duplicate', context, cause, recovery);
    this.name = 'DuplicateDetectionError';
  }
}

export class ConflictDetectionError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('conflict-detection-error', message, 'conflict', context, cause, recovery);
    this.name = 'ConflictDetectionError';
  }
}

export class ConflictResolutionError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('conflict-resolution-error', message, 'resolution', context, cause, recovery);
    this.name = 'ConflictResolutionError';
  }
}

export class IdentityGraphError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('identity-graph-error', message, 'graph', context, cause, recovery);
    this.name = 'IdentityGraphError';
  }
}

export class SimilarityError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('similarity-error', message, 'similarity', context, cause, recovery);
    this.name = 'SimilarityError';
  }
}

export class ScoringError extends DeduplicationError {
  constructor(message: string, context?: Record<string, unknown>, cause?: unknown, recovery?: string) {
    super('scoring-error', message, 'scoring', context, cause, recovery);
    this.name = 'ScoringError';
  }
}
