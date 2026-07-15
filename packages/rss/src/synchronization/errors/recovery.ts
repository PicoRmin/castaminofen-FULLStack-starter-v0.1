import type { FailureClassification } from '../types';

export interface RecoveryErrorDetails {
  readonly errorCode: string;
  readonly feedId?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly recoveryStage?: string | undefined;
  readonly failureClassification?: FailureClassification | undefined;
  readonly context?: Record<string, unknown> | undefined;
  readonly recoveryRecommendation?: string | undefined;
}

export class RecoveryEngineError extends Error {
  public readonly errorCode: string;
  public readonly feedId?: string | undefined;
  public readonly checkpointId?: string | undefined;
  public readonly recoveryStage?: string | undefined;
  public readonly failureClassification?: FailureClassification | undefined;
  public readonly context?: Record<string, unknown> | undefined;
  public readonly recoveryRecommendation?: string | undefined;

  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message);
    this.name = 'RecoveryEngineError';
    this.errorCode = details.errorCode;
    this.feedId = details.feedId;
    this.checkpointId = details.checkpointId;
    this.recoveryStage = details.recoveryStage;
    this.failureClassification = details.failureClassification;
    this.context = details.context;
    this.recoveryRecommendation = details.recoveryRecommendation;
  }
}

export class RetryPolicyError extends RecoveryEngineError {
  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message, { ...details, errorCode: details.errorCode ?? 'retry-policy-error' });
    this.name = 'RetryPolicyError';
  }
}

export class RecoveryPolicyError extends RecoveryEngineError {
  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message, { ...details, errorCode: details.errorCode ?? 'recovery-policy-error' });
    this.name = 'RecoveryPolicyError';
  }
}

export class FailureClassificationError extends RecoveryEngineError {
  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message, { ...details, errorCode: details.errorCode ?? 'failure-classification-error' });
    this.name = 'FailureClassificationError';
  }
}

export class CheckpointRecoveryError extends RecoveryEngineError {
  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message, { ...details, errorCode: details.errorCode ?? 'checkpoint-recovery-error' });
    this.name = 'CheckpointRecoveryError';
  }
}

export class RetryLimitExceededError extends RecoveryEngineError {
  public constructor(message: string, details: RecoveryErrorDetails) {
    super(message, { ...details, errorCode: details.errorCode ?? 'retry-limit-exceeded' });
    this.name = 'RetryLimitExceededError';
  }
}
