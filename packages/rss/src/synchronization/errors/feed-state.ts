export interface FeedStateErrorContext {
  readonly feedId?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly state?: string | undefined;
  readonly correlationId?: string | undefined;
  readonly fromState?: string | undefined;
  readonly toState?: string | undefined;
  readonly stateName?: string | undefined;
  readonly version?: number | undefined;
  readonly context?: Record<string, unknown> | undefined;
}

export interface FeedStateErrorDetails {
  readonly errorCode: string;
  readonly state?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly feedId?: string | undefined;
  readonly context?: Record<string, unknown> | undefined;
  readonly recoveryRecommendation?: string | undefined;
}

export class FeedStateError extends Error implements FeedStateErrorDetails {
  public readonly errorCode: string;
  public readonly state?: string | undefined;
  public readonly checkpointId?: string | undefined;
  public readonly feedId?: string | undefined;
  public readonly context?: Record<string, unknown> | undefined;
  public readonly recoveryRecommendation?: string | undefined;

  public constructor(message: string, details: FeedStateErrorDetails) {
    super(message);
    this.name = 'FeedStateError';
    this.errorCode = details.errorCode;
    this.state = details.state;
    this.checkpointId = details.checkpointId;
    this.feedId = details.feedId;
    this.context = details.context;
    this.recoveryRecommendation = details.recoveryRecommendation;
  }
}

export class InvalidStateTransitionError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'invalid-state-transition', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Validate the intended transition against the state machine before progressing.' });
    this.name = 'InvalidStateTransitionError';
  }
}

export class CheckpointNotFoundError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'checkpoint-not-found', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Create or restore a checkpoint before attempting the requested operation.' });
    this.name = 'CheckpointNotFoundError';
  }
}

export class CheckpointValidationError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'checkpoint-validation-error', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Recreate the checkpoint with valid metadata and version information.' });
    this.name = 'CheckpointValidationError';
  }
}

export class SnapshotCreationError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'snapshot-creation-error', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Verify the current state and checkpoint availability before creating a snapshot.' });
    this.name = 'SnapshotCreationError';
  }
}

export class StateVersionMismatchError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'state-version-mismatch', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Restore a matching checkpoint or update the state version before continuing.' });
    this.name = 'StateVersionMismatchError';
  }
}

export class StateConsistencyError extends FeedStateError {
  public constructor(message: string, context: FeedStateErrorContext = {}) {
    super(message, { errorCode: 'state-consistency-error', state: context.state, checkpointId: context.checkpointId, feedId: context.feedId, context: context.context, recoveryRecommendation: 'Inspect the state timestamp, version, and checkpoint reference for inconsistencies.' });
    this.name = 'StateConsistencyError';
  }
}

export function createFeedStateTransitionError(message: string, context: FeedStateErrorContext = {}): InvalidStateTransitionError {
  return new InvalidStateTransitionError(message, context);
}

export function createCheckpointNotFoundError(message: string, context: FeedStateErrorContext = {}): CheckpointNotFoundError {
  return new CheckpointNotFoundError(message, context);
}

export function createCheckpointValidationError(message: string, context: FeedStateErrorContext = {}): CheckpointValidationError {
  return new CheckpointValidationError(message, context);
}

export function createSnapshotCreationError(message: string, context: FeedStateErrorContext = {}): SnapshotCreationError {
  return new SnapshotCreationError(message, context);
}

export function createStateVersionMismatchError(message: string, context: FeedStateErrorContext = {}): StateVersionMismatchError {
  return new StateVersionMismatchError(message, context);
}

export function createFeedStateValidationError(message: string, context: FeedStateErrorContext = {}): StateConsistencyError {
  return new StateConsistencyError(message, context);
}

export function createStateConsistencyError(message: string, context: FeedStateErrorContext = {}): StateConsistencyError {
  return new StateConsistencyError(message, context);
}
