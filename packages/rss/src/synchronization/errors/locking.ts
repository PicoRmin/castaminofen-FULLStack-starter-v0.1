export interface FeedLockingErrorDetails {
  readonly code?: string;
  readonly lockId?: string;
  readonly feedId?: string;
  readonly owner?: string;
  readonly stage?: string;
  readonly recovery?: string;
  readonly context?: Record<string, unknown>;
}

export class FeedLockingError extends Error {
  public readonly code: string;
  public readonly stage: string;
  public readonly feedId: string | undefined;
  public readonly context: Record<string, unknown> | undefined;
  public readonly recovery: string | undefined;
  public readonly lockId: string | undefined;
  public readonly owner: string | undefined;

  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message);
    this.name = 'FeedLockingError';
    this.code = details.code ?? 'feed-locking-error';
    this.stage = details.stage ?? 'locking';
    this.feedId = details.feedId;
    this.context = { ...(details.context ?? {}), lockId: details.lockId, owner: details.owner };
    this.recovery = details.recovery;
    this.lockId = details.lockId;
    this.owner = details.owner;
  }
}

export class LockAcquisitionError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'lock-acquisition-failed',
      stage: details.stage ?? 'acquire',
      recovery:
        details.recovery ?? 'Release or recover the existing lock before requesting a new one.',
    });
    this.name = 'LockAcquisitionError';
  }
}

export class LeaseExpiredError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'lease-expired',
      stage: details.stage ?? 'lease',
      recovery:
        details.recovery ??
        'Recover the lock or wait for the lease to be invalidated before retrying.',
    });
    this.name = 'LeaseExpiredError';
  }
}

export class OwnershipValidationError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'ownership-validation-failed',
      stage: details.stage ?? 'ownership',
      recovery: details.recovery ?? 'Validate the owner identity before continuing.',
    });
    this.name = 'OwnershipValidationError';
  }
}

export class ConcurrencyConflictError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'concurrency-conflict',
      stage: details.stage ?? 'concurrency',
      recovery: details.recovery ?? 'Resolve the conflicting lock state before re-attempting.',
    });
    this.name = 'ConcurrencyConflictError';
  }
}

export class LockStateError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'lock-state-invalid',
      stage: details.stage ?? 'state',
      recovery:
        details.recovery ?? 'Inspect the current lock state and transition to a valid state.',
    });
    this.name = 'LockStateError';
  }
}

export class LeaseMismatchError extends FeedLockingError {
  public constructor(message: string, details: FeedLockingErrorDetails = {}) {
    super(message, {
      ...details,
      code: 'lease-mismatch',
      stage: details.stage ?? 'lease',
      recovery: details.recovery ?? 'Verify the lease identifier and version before execution.',
    });
    this.name = 'LeaseMismatchError';
  }
}
