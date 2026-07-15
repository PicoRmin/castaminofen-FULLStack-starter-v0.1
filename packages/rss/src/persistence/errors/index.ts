export type PersistenceErrorCode =
  | 'persistence-coordinator-error'
  | 'transaction-failure-error'
  | 'commit-failure-error'
  | 'rollback-failure-error'
  | 'repository-execution-error'
  | 'persistence-consistency-error'
  | 'execution-order-error';

export interface PersistenceErrorOptions {
  readonly stage: string;
  readonly transactionId?: string;
  readonly entity?: string | undefined;
  readonly context?: Record<string, unknown>;
  readonly cause?: unknown;
  readonly recovery?: string;
}

export abstract class PersistenceError extends Error {
  public readonly code: PersistenceErrorCode;
  public readonly stage: string;
  public readonly transactionId: string | undefined;
  public readonly entity: string | undefined;
  public readonly context: Record<string, unknown>;
  public readonly cause: unknown;
  public readonly recovery: string;

  protected constructor(code: PersistenceErrorCode, message: string, options: PersistenceErrorOptions) {
    super(message);
    this.name = 'PersistenceError';
    this.code = code;
    this.stage = options.stage;
    this.transactionId = options.transactionId ?? undefined;
    this.entity = options.entity ?? undefined;
    this.context = options.context ?? {};
    this.cause = options.cause;
    this.recovery = options.recovery ?? 'Inspect the persistence context and retry the transaction with the same plan.';
  }
}

export class PersistenceCoordinatorError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('persistence-coordinator-error', message, options);
    this.name = 'PersistenceCoordinatorError';
  }
}

export class TransactionFailureError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('transaction-failure-error', message, options);
    this.name = 'TransactionFailureError';
  }
}

export class CommitFailureError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('commit-failure-error', message, options);
    this.name = 'CommitFailureError';
  }
}

export class RollbackFailureError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('rollback-failure-error', message, options);
    this.name = 'RollbackFailureError';
  }
}

export class RepositoryExecutionError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('repository-execution-error', message, options);
    this.name = 'RepositoryExecutionError';
  }
}

export class PersistenceConsistencyError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('persistence-consistency-error', message, options);
    this.name = 'PersistenceConsistencyError';
  }
}

export class ExecutionOrderError extends PersistenceError {
  constructor(message: string, options: PersistenceErrorOptions) {
    super('execution-order-error', message, options);
    this.name = 'ExecutionOrderError';
  }
}
