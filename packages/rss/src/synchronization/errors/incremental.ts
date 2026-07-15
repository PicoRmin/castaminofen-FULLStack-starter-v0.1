export interface IncrementalErrorDetails {
  readonly errorCode: string;
  readonly stage: string;
  readonly feedId?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly context?: Record<string, unknown> | undefined;
  readonly recoveryRecommendation?: string | undefined;
}

export class IncrementalSynchronizationError extends Error implements IncrementalErrorDetails {
  public readonly errorCode: string;
  public readonly stage: string;
  public readonly feedId: string | undefined;
  public readonly checkpointId: string | undefined;
  public readonly context: Record<string, unknown> | undefined;
  public readonly recoveryRecommendation: string | undefined;

  public constructor(message: string, details: IncrementalErrorDetails) {
    super(message);
    this.name = 'IncrementalSynchronizationError';
    this.errorCode = details.errorCode;
    this.stage = details.stage;
    this.feedId = details.feedId;
    this.checkpointId = details.checkpointId;
    this.context = details.context;
    this.recoveryRecommendation = details.recoveryRecommendation;
  }
}

export class DifferenceEngineError extends IncrementalSynchronizationError {
  public constructor(
    message: string,
    context: Omit<IncrementalErrorDetails, 'errorCode' | 'stage'> & {
      readonly errorCode?: string;
      readonly stage?: string;
    } = {},
  ) {
    super(message, {
      errorCode: context.errorCode ?? 'difference-engine-error',
      stage: context.stage ?? 'diff',
      ...(context.feedId !== undefined ? { feedId: context.feedId } : {}),
      ...(context.checkpointId !== undefined ? { checkpointId: context.checkpointId } : {}),
      ...(context.context !== undefined ? { context: context.context } : {}),
      ...(context.recoveryRecommendation !== undefined
        ? { recoveryRecommendation: context.recoveryRecommendation }
        : {}),
    });
    this.name = 'DifferenceEngineError';
  }
}

export class ComparisonError extends IncrementalSynchronizationError {
  public constructor(
    message: string,
    context: Omit<IncrementalErrorDetails, 'errorCode' | 'stage'> & {
      readonly errorCode?: string;
      readonly stage?: string;
    } = {},
  ) {
    super(message, {
      errorCode: context.errorCode ?? 'comparison-error',
      stage: context.stage ?? 'comparison',
      ...(context.feedId !== undefined ? { feedId: context.feedId } : {}),
      ...(context.checkpointId !== undefined ? { checkpointId: context.checkpointId } : {}),
      ...(context.context !== undefined ? { context: context.context } : {}),
      ...(context.recoveryRecommendation !== undefined
        ? { recoveryRecommendation: context.recoveryRecommendation }
        : {}),
    });
    this.name = 'ComparisonError';
  }
}

export class CheckpointMismatchError extends IncrementalSynchronizationError {
  public constructor(
    message: string,
    context: Omit<IncrementalErrorDetails, 'errorCode' | 'stage'> & {
      readonly errorCode?: string;
      readonly stage?: string;
    } = {},
  ) {
    super(message, {
      errorCode: context.errorCode ?? 'checkpoint-mismatch',
      stage: context.stage ?? 'checkpoint',
      ...(context.feedId !== undefined ? { feedId: context.feedId } : {}),
      ...(context.checkpointId !== undefined ? { checkpointId: context.checkpointId } : {}),
      ...(context.context !== undefined ? { context: context.context } : {}),
      ...(context.recoveryRecommendation !== undefined
        ? { recoveryRecommendation: context.recoveryRecommendation }
        : {}),
    });
    this.name = 'CheckpointMismatchError';
  }
}

export class SynchronizationSnapshotError extends IncrementalSynchronizationError {
  public constructor(
    message: string,
    context: Omit<IncrementalErrorDetails, 'errorCode' | 'stage'> & {
      readonly errorCode?: string;
      readonly stage?: string;
    } = {},
  ) {
    super(message, {
      errorCode: context.errorCode ?? 'snapshot-invalid',
      stage: context.stage ?? 'snapshot',
      ...(context.feedId !== undefined ? { feedId: context.feedId } : {}),
      ...(context.checkpointId !== undefined ? { checkpointId: context.checkpointId } : {}),
      ...(context.context !== undefined ? { context: context.context } : {}),
      ...(context.recoveryRecommendation !== undefined
        ? { recoveryRecommendation: context.recoveryRecommendation }
        : {}),
    });
    this.name = 'SynchronizationSnapshotError';
  }
}
