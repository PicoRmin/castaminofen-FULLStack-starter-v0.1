import type { FeedCheckpoint, FeedSynchronizationState } from '../types';
import type {
  CircuitProtectionState,
  FailureClassification,
  FailureHistory,
  RecoveryPlan,
  RecoveryAction,
  RecoveryPolicyId,
  RetryDecision,
  RetryPolicyId,
} from '../types';
import type { FeedCheckpointManagerLike, FeedStateManagerLike } from './feed-state';
import type { RecoveryLifecycleHooks } from '../events/recovery';

export interface RetryPolicyLike {
  readonly id: RetryPolicyId;
  evaluate(context: RetryEvaluationContext): RetryDecision;
}

export interface RecoveryPolicyLike {
  readonly id: RecoveryPolicyId;
  evaluate(context: RecoveryEvaluationContext): RecoveryPlan;
}

export interface FailureClassifierLike {
  classify(error: unknown, context?: Record<string, unknown>): FailureClassification;
}

export interface RetryEvaluationContext {
  readonly attempt: number;
  readonly maxRetries: number;
  readonly classification: FailureClassification;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly recoveryAction?: RecoveryAction | undefined;
  readonly state?: FeedSynchronizationState | undefined;
  readonly checkpoint?: FeedCheckpoint | undefined;
}

export interface RecoveryEvaluationContext {
  readonly classification: FailureClassification;
  readonly retryDecision: RetryDecision;
  readonly state?: FeedSynchronizationState | undefined;
  readonly checkpoint?: FeedCheckpoint | undefined;
  readonly failureHistory: FailureHistory;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CheckpointRecoverySelection {
  readonly checkpoint?: FeedCheckpoint | undefined;
  readonly checkpointReference?: string | undefined;
  readonly reason: string;
  readonly warnings: readonly string[];
}

export interface CheckpointRecoveryStrategyLike {
  select(request: {
    state: FeedSynchronizationState;
    checkpoint?: FeedCheckpoint | undefined;
    feedStateManager?: FeedStateManagerLike | undefined;
    checkpointManager?: FeedCheckpointManagerLike | undefined;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<CheckpointRecoverySelection>;
}

export interface RecoveryEngineDependencies {
  readonly feedStateManager?: FeedStateManagerLike;
  readonly checkpointManager?: FeedCheckpointManagerLike;
  readonly classifier?: FailureClassifierLike;
  readonly retryPolicy?: RetryPolicyLike;
  readonly recoveryPolicy?: RecoveryPolicyLike;
  readonly checkpointRecoveryStrategy?: CheckpointRecoveryStrategyLike;
  readonly hooks?: RecoveryLifecycleHooks;
  readonly maxRetries?: number;
  readonly defaultRetryPolicyId?: RetryPolicyId;
  readonly defaultRecoveryPolicyId?: RecoveryPolicyId;
  readonly circuitProtection?: CircuitProtectionState;
}
