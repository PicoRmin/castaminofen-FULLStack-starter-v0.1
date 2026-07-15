export class SynchronizationError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly stage: string,
    public readonly feedId?: string,
    public readonly context?: Record<string, unknown>,
    public readonly recovery?: string,
  ) {
    super(message);
    this.name = 'SynchronizationError';
  }
}

export class SynchronizationStateError extends SynchronizationError {
  public constructor(
    message: string,
    code = 'synchronization-state-invalid',
    stage = 'state',
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message, code, stage, feedId, context, recovery);
    this.name = 'SynchronizationStateError';
  }
}

export class SynchronizationConflictError extends SynchronizationError {
  public constructor(
    message: string,
    code = 'synchronization-conflict',
    stage = 'conflict',
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message, code, stage, feedId, context, recovery);
    this.name = 'SynchronizationConflictError';
  }
}

export class SynchronizationTimeoutError extends SynchronizationError {
  public constructor(
    message: string,
    code = 'synchronization-timeout',
    stage = 'timeout',
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message, code, stage, feedId, context, recovery);
    this.name = 'SynchronizationTimeoutError';
  }
}

export class SynchronizationCancelledError extends SynchronizationError {
  public constructor(
    message: string,
    code = 'synchronization-cancelled',
    stage = 'cancel',
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message, code, stage, feedId, context, recovery);
    this.name = 'SynchronizationCancelledError';
  }
}

export class SynchronizationStrategyError extends SynchronizationError {
  public constructor(
    message: string,
    code = 'synchronization-strategy-invalid',
    stage = 'strategy',
    feedId?: string,
    context?: Record<string, unknown>,
    recovery?: string,
  ) {
    super(message, code, stage, feedId, context, recovery);
    this.name = 'SynchronizationStrategyError';
  }
}

export * from './feed-state';
export * from './incremental';
export * from './locking';
export * from './recovery';
