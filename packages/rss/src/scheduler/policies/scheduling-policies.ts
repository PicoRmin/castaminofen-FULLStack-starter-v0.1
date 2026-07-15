import type { SchedulingPolicyContract } from '../contracts/scheduling-policy-contract';
import type {
  SchedulerContext,
  SchedulerPolicyEvaluationResult,
  SchedulerTimeProvider,
} from '../types';
import type { SchedulerTriggerContract } from '../contracts/scheduler-trigger-contract';
import { InvalidSchedulingPolicy } from '../errors/scheduler-errors';

abstract class BaseSchedulingPolicy implements SchedulingPolicyContract {
  public constructor(
    public readonly id: string,
    public readonly kind:
      | 'fixed-interval'
      | 'cron-expression'
      | 'adaptive'
      | 'exponential-backoff'
      | 'priority'
      | 'custom',
    public readonly description: string,
  ) {}

  public validate(): void {
    if (!this.id.trim()) {
      throw new InvalidSchedulingPolicy('Policy id is required.', {
        policyId: this.id,
        executionStage: 'validation',
      });
    }
  }

  public abstract evaluate(
    context: SchedulerContext,
    trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult;
}

export class FixedIntervalPolicy extends BaseSchedulingPolicy {
  public constructor(private readonly intervalMs: number = 1000) {
    super('fixed-interval', 'fixed-interval', 'Fires on a fixed interval.');
  }

  public override validate(): void {
    super.validate();
    if (!Number.isFinite(this.intervalMs) || this.intervalMs <= 0) {
      throw new InvalidSchedulingPolicy('Interval must be a positive number.', {
        policyId: this.id,
        executionStage: 'validation',
      });
    }
  }

  public override evaluate(
    context: SchedulerContext,
    _trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult {
    const now = timeProvider.now();
    const nextRunAt = now + this.intervalMs;
    return {
      shouldTrigger: true,
      reason: 'fixed-interval',
      priority: context.priority,
      delayMs: Math.max(0, nextRunAt - now),
      scheduleAt: nextRunAt,
    };
  }
}

export class CronExpressionPolicy extends BaseSchedulingPolicy {
  public constructor(private readonly expression: string) {
    super('cron-expression', 'cron-expression', 'Evaluates a cron expression.');
  }

  public override validate(): void {
    super.validate();
    if (!this.expression.trim()) {
      throw new InvalidSchedulingPolicy('Cron expression is required.', {
        policyId: this.id,
        executionStage: 'validation',
      });
    }
  }

  public override evaluate(
    context: SchedulerContext,
    _trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult {
    const now = timeProvider.now();
    return {
      shouldTrigger: true,
      reason: 'cron-expression',
      priority: context.priority,
      delayMs: 0,
      scheduleAt: now,
    };
  }
}

export class AdaptiveSchedulingPolicy extends BaseSchedulingPolicy {
  public constructor() {
    super('adaptive', 'adaptive', 'Adapts to workload by using the current priority.');
  }

  public override evaluate(
    context: SchedulerContext,
    _trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult {
    const now = timeProvider.now();
    return {
      shouldTrigger: true,
      reason: 'adaptive',
      priority: Math.max(1, context.priority + 1),
      delayMs: 0,
      scheduleAt: now,
    };
  }
}

export class ExponentialBackoffPolicy extends BaseSchedulingPolicy {
  public constructor(private readonly baseDelayMs: number = 250) {
    super('exponential-backoff', 'exponential-backoff', 'Applies exponential backoff.');
  }

  public override validate(): void {
    super.validate();
    if (!Number.isFinite(this.baseDelayMs) || this.baseDelayMs <= 0) {
      throw new InvalidSchedulingPolicy('Base delay must be positive.', {
        policyId: this.id,
        executionStage: 'validation',
      });
    }
  }

  public override evaluate(
    context: SchedulerContext,
    _trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult {
    const now = timeProvider.now();
    const delayMs = this.baseDelayMs * Math.max(1, context.priority);
    return {
      shouldTrigger: true,
      reason: 'exponential-backoff',
      priority: context.priority,
      delayMs,
      scheduleAt: now + delayMs,
    };
  }
}

export class PrioritySchedulingPolicy extends BaseSchedulingPolicy {
  public constructor() {
    super('priority', 'priority', 'Prioritizes high-value triggers.');
  }

  public override evaluate(
    context: SchedulerContext,
    _trigger: SchedulerTriggerContract,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult {
    const now = timeProvider.now();
    return {
      shouldTrigger: true,
      reason: 'priority',
      priority: context.priority,
      delayMs: 0,
      scheduleAt: now,
    };
  }
}
