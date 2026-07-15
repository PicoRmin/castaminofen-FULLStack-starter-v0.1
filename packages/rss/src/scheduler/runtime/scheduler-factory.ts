import { FixedIntervalPolicy, CronExpressionPolicy, AdaptiveSchedulingPolicy, ExponentialBackoffPolicy, PrioritySchedulingPolicy } from '../policies/scheduling-policies';
import type { SchedulingPolicyContract } from '../contracts/scheduling-policy-contract';
import type { SchedulerRegistry as SchedulerRegistryType } from './scheduler-registry';
import { InvalidSchedulingPolicy } from '../errors/scheduler-errors';

export interface SchedulerFactoryDependencies {
  readonly registry: SchedulerRegistryType;
}

export class SchedulerFactory {
  private readonly registry: SchedulerRegistryType;

  public constructor(dependencies: SchedulerFactoryDependencies) {
    this.registry = dependencies.registry;
  }

  public createPolicy(kind: string, config?: Record<string, unknown>): SchedulingPolicyContract {
    switch (kind) {
      case 'fixed-interval':
        return new FixedIntervalPolicy((config?.intervalMs as number | undefined) ?? 1000);
      case 'cron-expression':
        return new CronExpressionPolicy((config?.expression as string | undefined) ?? '*/5 * * * *');
      case 'adaptive':
        return new AdaptiveSchedulingPolicy();
      case 'exponential-backoff':
        return new ExponentialBackoffPolicy((config?.baseDelayMs as number | undefined) ?? 250);
      case 'priority':
        return new PrioritySchedulingPolicy();
      default:
        throw new InvalidSchedulingPolicy(`Unsupported policy kind: ${kind}`, {
          policyId: kind,
          executionStage: 'factory',
        });
    }
  }

  public registerPolicy(policy: SchedulingPolicyContract): void {
    this.registry.register({
      id: policy.id,
      name: policy.id,
      feedId: 'registry',
      correlationId: policy.id,
      kind: 'manual',
      policyId: policy.id,
      priority: 1,
      payload: undefined,
      metadata: {},
      createdAt: Date.now(),
      nextRunAt: Date.now(),
      scheduleName: policy.id,
      configuration: {},
      evaluate: () => ({ shouldTrigger: true, reason: 'registry', priority: 1, delayMs: 0, scheduleAt: Date.now() }),
      createContext: () => ({
        schedulerId: 'factory',
        triggerId: policy.id,
        feedId: 'registry',
        correlationId: policy.id,
        executionId: policy.id,
        policyId: policy.id,
        scheduleName: policy.id,
        priority: 1,
        creationTimestamp: Date.now(),
        metadata: {},
        triggerKind: 'custom',
        state: 'created',
        scheduledFor: Date.now(),
        policyKind: 'custom',
      }),
    } as never);
  }
}
