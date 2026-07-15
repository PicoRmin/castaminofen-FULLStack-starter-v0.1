import type { SchedulerContext, SchedulerTimeProvider, SchedulerTriggerKind } from '../types';
import type { SchedulingPolicyContract } from '../contracts/scheduling-policy-contract';
import type { SchedulerTriggerContract } from '../contracts/scheduler-trigger-contract';
import { SchedulerContextFactory } from '../context/scheduler-context';

export abstract class BaseTrigger<TPayload = unknown> implements SchedulerTriggerContract<TPayload> {
  public readonly createdAt: number;
  public readonly nextRunAt: number;
  public readonly configuration: Readonly<Record<string, unknown>>;
  public readonly metadata: Readonly<Record<string, unknown>>;
  public readonly priority: number;
  public readonly policyId: string;
  public readonly correlationId: string;
  public readonly scheduleName: string;
  public readonly timezone?: string;
  public readonly expression?: string;

  protected constructor(params: {
    readonly id: string;
    readonly name: string;
    readonly feedId: string;
    readonly correlationId?: string;
    readonly policyId?: string;
    readonly priority?: number;
    readonly payload?: TPayload;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly createdAt?: number;
    readonly nextRunAt?: number;
    readonly scheduleName?: string;
    readonly configuration?: Readonly<Record<string, unknown>>;
    readonly expression?: string;
    readonly timezone?: string;
  }) {
    this.createdAt = params.createdAt ?? Date.now();
    this.nextRunAt = params.nextRunAt ?? this.createdAt;
    this.configuration = params.configuration ?? Object.freeze({});
    this.metadata = params.metadata ?? Object.freeze({});
    this.priority = params.priority ?? 1;
    this.policyId = params.policyId ?? 'fixed-interval';
    this.correlationId = params.correlationId ?? `corr-${params.id}`;
    this.scheduleName = params.scheduleName ?? params.name;
    this.timezone = params.timezone;
    this.expression = params.expression;
  }

  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly feedId: string;
  public abstract readonly kind: SchedulerTriggerKind;
  public abstract readonly payload: TPayload | undefined;

  public evaluate(context: SchedulerContext, policy: SchedulingPolicyContract | undefined, timeProvider: SchedulerTimeProvider) {
    if (!policy) {
      return {
        shouldTrigger: true,
        reason: 'default-policy',
        priority: context.priority,
        delayMs: 0,
        scheduleAt: timeProvider.now(),
      };
    }

    return policy.evaluate(context, this, timeProvider);
  }

  public createContext(schedulerId: string, policyId: string, timeProvider: SchedulerTimeProvider, state = 'created'): SchedulerContext {
    return new SchedulerContextFactory().createContext({
      schedulerId,
      triggerId: this.id,
      feedId: this.feedId,
      correlationId: this.correlationId,
      executionId: `${this.id}-${timeProvider.now()}`,
      policyId,
      scheduleName: this.scheduleName,
      priority: this.priority,
      creationTimestamp: timeProvider.now(),
      metadata: this.metadata,
      triggerKind: this.kind,
      state: state as never,
      scheduledFor: this.nextRunAt,
      policyKind: 'custom',
    });
  }
}
