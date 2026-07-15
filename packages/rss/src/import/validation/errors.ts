export type EngineErrorCode = 'validation-error' | 'matching-error' | 'conflict-error' | 'merge-error' | 'decision-error' | 'hashing-error';

export interface EngineErrorContext {
  readonly stage: string;
  readonly entity: string;
  readonly context?: Record<string, unknown>;
  readonly recovery?: string;
}

export class ImportEngineError extends Error {
  public readonly code: EngineErrorCode;
  public readonly stage: string;
  public readonly entity: string;
  public readonly context: Record<string, unknown> | undefined;
  public readonly recovery: string | undefined;

  constructor(code: EngineErrorCode, message: string, stage: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super(message);
    this.name = 'ImportEngineError';
    this.code = code;
    this.stage = stage;
    this.entity = entity;
    this.context = context;
    this.recovery = recovery;
  }
}

export class ValidationEngineError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('validation-error', message, 'validation', entity, context, recovery);
    this.name = 'ValidationEngineError';
  }
}

export class MatchingError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('matching-error', message, 'matching', entity, context, recovery);
    this.name = 'MatchingError';
  }
}

export class ConflictError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('conflict-error', message, 'conflicts', entity, context, recovery);
    this.name = 'ConflictError';
  }
}

export class MergeError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('merge-error', message, 'merge', entity, context, recovery);
    this.name = 'MergeError';
  }
}

export class DecisionError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('decision-error', message, 'decision', entity, context, recovery);
    this.name = 'DecisionError';
  }
}

export class HashingError extends ImportEngineError {
  constructor(message: string, entity: string, context?: Record<string, unknown>, recovery?: string) {
    super('hashing-error', message, 'hashing', entity, context, recovery);
    this.name = 'HashingError';
  }
}
