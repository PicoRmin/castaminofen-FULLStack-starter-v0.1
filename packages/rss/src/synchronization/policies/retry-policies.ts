import type { RetryDecision, RetryPolicyId } from '../types';
import type { RetryEvaluationContext, RetryPolicyLike } from '../interfaces/recovery';
import { RetryPolicyError } from '../errors';

export class NoRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'none';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    return Object.freeze({
      allowed: false,
      reason: 'Retry policy is disabled.',
      retryCount: context.attempt,
      maxRetries: context.maxRetries,
      delayMs: 0,
      nextAttemptAt: Date.now(),
      recoveryRecommendation: 'permanent-failure',
      confidence: 1,
      policyId: this.id,
      metadata: Object.freeze({}),
    }) as RetryDecision;
  }
}

export class ImmediateRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'immediate';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    return createRetryDecision(context, 0, 'retry immediately', this.id);
  }
}

export class FixedDelayRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'fixed-delay';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    return createRetryDecision(context, 100, 'retry after fixed delay', this.id);
  }
}

export class LinearBackoffRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'linear-backoff';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    return createRetryDecision(
      context,
      100 * context.attempt,
      'retry with linear backoff',
      this.id,
    );
  }
}

export class ExponentialBackoffRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'exponential-backoff';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    return createRetryDecision(
      context,
      100 * 2 ** (context.attempt - 1),
      'retry with exponential backoff',
      this.id,
    );
  }
}

export class ExponentialBackoffWithJitterRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'exponential-backoff-with-jitter';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    const jitter = context.attempt % 2 === 0 ? 25 : 0;
    return createRetryDecision(
      context,
      100 * 2 ** (context.attempt - 1) + jitter,
      'retry with exponential backoff and jitter',
      this.id,
    );
  }
}

export class AdaptiveRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'adaptive';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    const delay =
      context.classification.kind === 'timeout'
        ? 100
        : context.classification.kind === 'infrastructure'
          ? 250
          : 500;
    return createRetryDecision(
      context,
      delay,
      'retry adaptively based on failure classification',
      this.id,
    );
  }
}

export class CustomRetryPolicy implements RetryPolicyLike {
  public readonly id: RetryPolicyId = 'custom';
  public evaluate(context: RetryEvaluationContext): RetryDecision {
    const delay = Number((context.metadata.delayMs as number | undefined) ?? 100);
    return createRetryDecision(context, delay, 'retry with custom policy', this.id);
  }
}

export class RetryPolicyRegistry {
  public static createDefault(): readonly RetryPolicyLike[] {
    return Object.freeze([
      new NoRetryPolicy(),
      new ImmediateRetryPolicy(),
      new FixedDelayRetryPolicy(),
      new LinearBackoffRetryPolicy(),
      new ExponentialBackoffRetryPolicy(),
      new ExponentialBackoffWithJitterRetryPolicy(),
      new AdaptiveRetryPolicy(),
      new CustomRetryPolicy(),
    ]) as readonly RetryPolicyLike[];
  }

  public static resolve(
    id: RetryPolicyId,
    policies: readonly RetryPolicyLike[] = RetryPolicyRegistry.createDefault(),
  ): RetryPolicyLike {
    const match = policies.find((policy) => policy.id === id);
    if (!match) {
      throw new RetryPolicyError('Unsupported retry policy.', {
        errorCode: 'retry-policy-not-found',
        context: { retryPolicyId: id },
        recoveryRecommendation: 'Choose a built-in retry policy or supply a custom implementation.',
      });
    }
    return match;
  }
}

function createRetryDecision(
  context: RetryEvaluationContext,
  delayMs: number,
  reason: string,
  policyId: RetryPolicyId,
): RetryDecision {
  const allowed = context.attempt <= context.maxRetries && context.classification.retryable;
  const nextAttemptAt = Date.now() + delayMs;
  return Object.freeze({
    allowed,
    reason,
    retryCount: context.attempt,
    maxRetries: context.maxRetries,
    delayMs,
    nextAttemptAt,
    recoveryRecommendation: context.recoveryAction ?? 'resume-from-checkpoint',
    confidence: context.classification.confidence,
    policyId,
    metadata: Object.freeze({ classification: context.classification.kind }),
  }) as RetryDecision;
}
