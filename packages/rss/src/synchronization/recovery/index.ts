import type { FeedCheckpoint, FeedSynchronizationState } from '../types';
import type {
  RecoveryEngineDependencies,
  CheckpointRecoverySelection,
  CheckpointRecoveryStrategyLike,
} from '../interfaces/recovery';
import { FeedCheckpointManager } from '../checkpoints/feed-checkpoint-manager';
import { FeedStateManager } from '../state/feed-state-manager';
import { FailureClassifier } from '../classification/failure-classifier';
import { RetryPolicyRegistry, FixedDelayRetryPolicy } from '../policies';
import { RecoveryPolicyRegistry, ResumeFromCheckpointPolicy } from '../policies';
import { CheckpointRecoveryError, RetryLimitExceededError } from '../errors';
import type {
  FailureClassification,
  FailureHistory,
  RecoveryPlan,
  RetryDecision,
  RecoveryAction,
  RecoveryPolicyId,
  RetryPolicyId,
} from '../types';
import type { RecoveryLifecycleHooks } from '../events';

export interface SynchronizationRecoveryEngineEvaluationRequest {
  readonly feedId: string;
  readonly checkpointId?: string | undefined;
  readonly failure: unknown;
  readonly state?: FeedSynchronizationState | undefined;
  readonly checkpoint?: FeedCheckpoint | undefined;
  readonly attempt: number;
  readonly maxRetries: number;
  readonly metadata?: Record<string, unknown> | undefined;
}

export class SynchronizationRecoveryEngine {
  private readonly feedStateManager;
  private readonly checkpointManager;
  private readonly classifier;
  private readonly retryPolicy;
  private readonly recoveryPolicy;
  private readonly checkpointRecoveryStrategy;
  private readonly hooks;
  private readonly maxRetries;

  public constructor(dependencies: RecoveryEngineDependencies = {}) {
    this.feedStateManager = dependencies.feedStateManager ?? new FeedStateManager();
    this.checkpointManager = dependencies.checkpointManager ?? new FeedCheckpointManager();
    this.classifier = dependencies.classifier ?? new FailureClassifier();
    this.retryPolicy = dependencies.retryPolicy ?? new FixedDelayRetryPolicy();
    this.recoveryPolicy = dependencies.recoveryPolicy ?? new ResumeFromCheckpointPolicy();
    this.checkpointRecoveryStrategy =
      dependencies.checkpointRecoveryStrategy ?? new DefaultCheckpointRecoveryStrategy();
    this.hooks = dependencies.hooks;
    this.maxRetries = dependencies.maxRetries ?? 3;
  }

  public async evaluateFailure(
    request: SynchronizationRecoveryEngineEvaluationRequest,
  ): Promise<RecoveryPlan> {
    const state =
      request.state ??
      this.feedStateManager.createState(request.feedId, undefined, request.metadata);
    const checkpoint =
      request.checkpoint ??
      (request.checkpointId
        ? this.checkpointManager.restoreCheckpoint(request.feedId, request.checkpointId)
        : undefined);
    const classification = this.classifier.classify(request.failure, {
      feedId: request.feedId,
      checkpointId: checkpoint?.id,
      attempt: request.attempt,
      ...request.metadata,
    });
    const failureHistory = this.createFailureHistory(request, classification, state, checkpoint);
    const retryPolicyId = this.resolveRetryPolicyId(request.metadata);
    const recoveryPolicyId = this.resolveRecoveryPolicyId(request.metadata);
    const retryPolicy = RetryPolicyRegistry.resolve(retryPolicyId);
    const recoveryPolicy = RecoveryPolicyRegistry.resolve(recoveryPolicyId);
    const retryDecision = retryPolicy.evaluate({
      attempt: request.attempt,
      maxRetries: request.maxRetries,
      classification,
      metadata: Object.freeze({ ...(request.metadata ?? {}), retryPolicyId }),
      recoveryAction:
        recoveryPolicyId === 'permanent-failure' ? 'permanent-failure' : 'resume-from-checkpoint',
      state,
      checkpoint,
    });
    const recoveryPlan = recoveryPolicy.evaluate({
      classification,
      retryDecision,
      state,
      checkpoint,
      failureHistory,
      metadata: Object.freeze({ ...(request.metadata ?? {}), retryPolicyId, recoveryPolicyId }),
    });
    const recoveryAction = this.resolveRecoveryAction(
      recoveryPlan,
      classification,
      retryDecision,
      checkpoint,
    );
    const selection = await this.checkpointRecoveryStrategy.select({
      state,
      checkpoint,
      feedStateManager: this.feedStateManager,
      checkpointManager: this.checkpointManager,
      metadata: {
        ...(request.metadata ?? {}),
        checkpointId: request.checkpointId,
        attempt: request.attempt,
      },
    });
    const warnings = this.buildWarnings(
      selection,
      classification,
      retryDecision,
      request,
      state,
      checkpoint,
    );
    const plan = Object.freeze({
      ...recoveryPlan,
      recoveryAction,
      checkpointReference: selection.checkpointReference ?? recoveryPlan.checkpointReference,
      retryPolicy: retryPolicyId,
      recoveryPolicy: recoveryPolicyId,
      retryDecision: Object.freeze({ ...retryDecision, policyId: retryPolicyId }),
      recoveryMetadata: Object.freeze({
        ...(recoveryPlan.recoveryMetadata as Record<string, unknown>),
        checkpointReference: selection.checkpointReference ?? recoveryPlan.checkpointReference,
        selectedCheckpointReason: selection.reason,
      }),
      warnings,
      statistics: Object.freeze({
        ...recoveryPlan.statistics,
        attempt: request.attempt,
        maxRetries: request.maxRetries,
        checkpointSelected: Boolean(selection.checkpointReference || checkpoint?.id),
      }),
      createdAt: Date.now(),
    }) as RecoveryPlan;
    if (!retryDecision.allowed && request.attempt >= request.maxRetries) {
      throw new RetryLimitExceededError('Retry limit exceeded for the supplied failure.', {
        errorCode: 'retry-limit-exceeded',
        feedId: request.feedId,
        checkpointId: checkpoint?.id,
        recoveryStage: 'retry-evaluation',
        failureClassification: classification,
        context: { attempt: request.attempt, maxRetries: request.maxRetries },
        recoveryRecommendation:
          'Stop retrying and transition to permanent failure or manual intervention.',
      });
    }
    await this.emit('failure-classified', 'recovery', 'Failure classified', {
      feedId: request.feedId,
      classification,
    });
    await this.emit('retry-scheduled', 'recovery', 'Retry scheduled', {
      feedId: request.feedId,
      retryDecision,
    });
    await this.emit('recovery-selected', 'recovery', 'Recovery selected', {
      feedId: request.feedId,
      recoveryAction,
    });
    return plan;
  }

  private createFailureHistory(
    request: SynchronizationRecoveryEngineEvaluationRequest,
    classification: FailureClassification,
    state: FeedSynchronizationState,
    checkpoint?: FeedCheckpoint,
  ): FailureHistory {
    const retryCount = Math.max(0, request.attempt - 1);
    const failureCount = state.failureCount + 1;
    const consecutiveFailures = Math.max(1, state.failureCount + 1);
    return Object.freeze({
      retryCount,
      failureCount,
      consecutiveFailures,
      lastFailure: Object.freeze({
        occurredAt: Date.now(),
        classification: classification.kind,
        retryCount,
        failureCount,
        consecutiveFailures,
        context: Object.freeze({
          feedId: request.feedId,
          checkpointId: checkpoint?.id,
          attempt: request.attempt,
        }),
      }),
      failureTimeline: Object.freeze([]),
      lastSuccessfulRecovery: state.lastSuccessfulSynchronization,
      recoveryHistoryMetadata: Object.freeze({ checkpointReference: checkpoint?.id }),
    }) as FailureHistory;
  }

  private resolveRecoveryAction(
    plan: RecoveryPlan,
    classification: FailureClassification,
    retryDecision: RetryDecision,
    checkpoint?: FeedCheckpoint,
  ): RecoveryAction {
    if (!retryDecision.allowed || !classification.retryable) {
      return 'permanent-failure';
    }
    return plan.recoveryAction === 'resume-from-checkpoint' && checkpoint?.valid !== false
      ? 'resume-from-checkpoint'
      : plan.recoveryAction;
  }

  private resolveRetryPolicyId(metadata?: Record<string, unknown>): RetryPolicyId {
    const selected = (metadata?.retryPolicy as RetryPolicyId | undefined) ?? 'fixed-delay';
    return selected;
  }

  private resolveRecoveryPolicyId(metadata?: Record<string, unknown>): RecoveryPolicyId {
    const selected =
      (metadata?.recoveryPolicy as RecoveryPolicyId | undefined) ?? 'resume-from-checkpoint';
    return selected;
  }

  private async emit(
    type: string,
    stage: string,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    await this.hooks?.onFailureClassified?.({
      type,
      stage,
      message,
      context: context ?? undefined,
      timestamp: Date.now(),
    });
    await this.hooks?.onRetryScheduled?.({
      type,
      stage,
      message,
      context: context ?? undefined,
      timestamp: Date.now(),
    });
    await this.hooks?.onRecoverySelected?.({
      type,
      stage,
      message,
      context: context ?? undefined,
      timestamp: Date.now(),
    });
  }

  private buildWarnings(
    selection: CheckpointRecoverySelection,
    classification: FailureClassification,
    retryDecision: RetryDecision,
    request: SynchronizationRecoveryEngineEvaluationRequest,
    state: FeedSynchronizationState,
    checkpoint?: FeedCheckpoint,
  ): string[] {
    const warnings: string[] = [];
    if (!selection.checkpointReference && request.checkpointId) {
      warnings.push(
        'Checkpoint reference could not be resolved, so recovery will fall back to the current state.',
      );
    }
    if (classification.kind === 'timeout') {
      warnings.push(
        'Timeout failure detected; the system should validate the checkpoint before retrying.',
      );
    }
    if (retryDecision.retryCount >= Math.max(1, this.maxRetries - 1)) {
      warnings.push('Retry limit is approaching.');
    }
    if (checkpoint && checkpoint.valid === false) {
      warnings.push('Checkpoint is invalid and should be discarded before recovery.');
    }
    if (state.currentVersion > 1 && !checkpoint) {
      warnings.push('Recovery is proceeding without a checkpoint.');
    }
    return warnings;
  }
}

export class DefaultCheckpointRecoveryStrategy implements CheckpointRecoveryStrategyLike {
  public async select(request: {
    state: FeedSynchronizationState;
    checkpoint?: FeedCheckpoint | undefined;
    feedStateManager?:
      | {
          createSnapshot?: (
            state: FeedSynchronizationState,
            checkpoint?: FeedCheckpoint,
            metadata?: Record<string, unknown>,
          ) => unknown;
        }
      | undefined;
    checkpointManager?:
      | {
          restoreCheckpoint?: (feedId: string, checkpointId: string) => FeedCheckpoint | undefined;
          list?: (feedId: string) => Promise<readonly FeedCheckpoint[]>;
        }
      | undefined;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<CheckpointRecoverySelection> {
    const checkpointId =
      (request.metadata?.checkpointId as string | undefined) ??
      request.checkpoint?.id ??
      request.state.checkpointReference;
    const checkpoint = checkpointId
      ? (request.checkpoint ??
        (request.checkpointManager?.restoreCheckpoint
          ? request.checkpointManager.restoreCheckpoint(request.state.feedId, checkpointId)
          : undefined))
      : request.checkpoint;
    if (checkpoint && checkpoint.valid === false) {
      return {
        checkpoint: undefined,
        checkpointReference: undefined,
        reason: 'discard-invalid-checkpoint',
        warnings: ['Discarded invalid checkpoint before recovery.'],
      };
    }
    return {
      checkpoint: checkpoint ?? request.checkpoint,
      checkpointReference:
        checkpoint?.id ?? request.checkpoint?.id ?? request.state.checkpointReference,
      reason: checkpoint ? 'resume-from-latest-checkpoint' : 'no-checkpoint-available',
      warnings: [],
    };
  }
}

export { RetryPolicyRegistry, RecoveryPolicyRegistry } from '../policies';
