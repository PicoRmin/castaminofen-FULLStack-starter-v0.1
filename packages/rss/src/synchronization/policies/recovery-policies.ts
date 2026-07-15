import type { RecoveryPlan, RecoveryPolicyId, RetryDecision, RecoveryAction } from '../types';
import type { RecoveryEvaluationContext, RecoveryPolicyLike } from '../interfaces/recovery';
import { RecoveryPolicyError } from '../errors';

export class ResumeFromCheckpointPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'resume-from-checkpoint';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'resume-from-checkpoint',
      'resume-from-checkpoint',
      'resume-from-checkpoint',
      'resume from the most recent valid checkpoint',
    );
  }
}

export class RestartSynchronizationPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'restart-synchronization';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'restart-synchronization',
      'restart-synchronization',
      'restart-synchronization',
      'restart the entire synchronization flow',
    );
  }
}

export class RestartDownloadPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'restart-download';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'restart-download',
      'restart-download',
      'restart-download',
      'restart the download stage',
    );
  }
}

export class RestartImportPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'restart-import';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'restart-import',
      'restart-import',
      'restart-import',
      'restart the import stage',
    );
  }
}

export class RollbackStatePolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'rollback-state';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'rollback-state',
      'rollback-state',
      'rollback-state',
      'rollback to the last stable state',
    );
  }
}

export class PauseSynchronizationPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'pause-synchronization';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'pause-synchronization',
      'pause-synchronization',
      'pause-synchronization',
      'pause and require manual review',
    );
  }
}

export class PermanentFailurePolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'permanent-failure';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'permanent-failure',
      'none',
      'permanent-failure',
      'stop retrying and mark the failure permanent',
    );
  }
}

export class ManualInterventionPolicy implements RecoveryPolicyLike {
  public readonly id: RecoveryPolicyId = 'manual-intervention';
  public evaluate(context: RecoveryEvaluationContext): RecoveryPlan {
    return createRecoveryPlan(
      context,
      'manual-intervention',
      'none',
      'manual-intervention',
      'manual intervention is required',
    );
  }
}

export class RecoveryPolicyRegistry {
  public static createDefault(): readonly RecoveryPolicyLike[] {
    return Object.freeze([
      new ResumeFromCheckpointPolicy(),
      new RestartSynchronizationPolicy(),
      new RestartDownloadPolicy(),
      new RestartImportPolicy(),
      new RollbackStatePolicy(),
      new PauseSynchronizationPolicy(),
      new PermanentFailurePolicy(),
      new ManualInterventionPolicy(),
    ]) as readonly RecoveryPolicyLike[];
  }

  public static resolve(
    id: RecoveryPolicyId,
    policies: readonly RecoveryPolicyLike[] = RecoveryPolicyRegistry.createDefault(),
  ): RecoveryPolicyLike {
    const match = policies.find((policy) => policy.id === id);
    if (!match) {
      throw new RecoveryPolicyError('Unsupported recovery policy.', {
        errorCode: 'recovery-policy-not-found',
        context: { recoveryPolicyId: id },
        recoveryRecommendation:
          'Choose a built-in recovery policy or supply a custom implementation.',
      });
    }
    return match;
  }
}

function createRecoveryPlan(
  context: RecoveryEvaluationContext,
  action: RecoveryAction,
  policy: RecoveryPolicyId,
  recoveryPolicy: RecoveryPolicyId,
  reason: string,
): RecoveryPlan {
  const checkpointReference = context.checkpoint?.id ?? context.state?.checkpointReference;
  const statistics = Object.freeze({
    failures: context.failureHistory.failureCount,
    retries: context.failureHistory.retryCount,
    consecutiveFailures: context.failureHistory.consecutiveFailures,
    checkpointSelected: Boolean(checkpointReference),
  });
  return Object.freeze({
    recoveryAction: action,
    checkpointReference,
    retryPolicy: context.retryDecision.policyId,
    recoveryPolicy,
    failureClassification: context.classification,
    retryDecision: context.retryDecision,
    recoveryMetadata: Object.freeze({ reason, retryable: context.classification.retryable }),
    warnings: Object.freeze([]),
    statistics,
    createdAt: Date.now(),
  }) as RecoveryPlan;
}
