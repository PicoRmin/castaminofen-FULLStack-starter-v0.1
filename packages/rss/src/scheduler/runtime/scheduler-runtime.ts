import type { QueueAdapter } from '../../queue/interfaces/queue-adapter';
import type { QueueJobEnvelope } from '../../queue/contracts/queue-job-contract';
import type { SchedulerTriggerContract } from '../contracts/scheduler-trigger-contract';
import type { SchedulingPolicyContract } from '../contracts/scheduling-policy-contract';
import { createSchedulerLifecycleEvent } from '../events/scheduler-events';
import { ScheduleConflictError, TriggerDispatchError, SchedulerConfigurationError } from '../errors/scheduler-errors';
import type { SchedulerContext, SchedulerRuntimeDependencies, SchedulerTimeProvider, SchedulerTriggerDefinition } from '../types';
import { SystemTimeProvider } from '../types';
import { FixedIntervalPolicy } from '../policies/scheduling-policies';
import { ManualTrigger } from '../triggers/manual-trigger';
import { CronTrigger } from '../triggers/cron-trigger';
import { OneTimeTrigger } from '../triggers/one-time-trigger';
import { RecurringTrigger } from '../triggers/recurring-trigger';
import { IntervalTrigger } from '../triggers/interval-trigger';

export class SchedulerRuntime {
  private readonly registry = new Map<string, SchedulerTriggerContract>();
  private readonly schedulers = new Map<string, { id: string; name: string; queueAdapter: QueueAdapter }>();
  private readonly policies = new Map<string, SchedulingPolicyContract>();
  private readonly events: Array<ReturnType<typeof createSchedulerLifecycleEvent>> = [];
  private readonly queueAdapter: QueueAdapter;
  private readonly timeProvider: SchedulerTimeProvider;
  private readonly configuration: SchedulerRuntimeDependencies['configuration'];
  private readonly telemetry: SchedulerRuntimeDependencies['telemetry'];

  public constructor(dependencies: SchedulerRuntimeDependencies) {
    this.queueAdapter = dependencies.queueAdapter;
    this.timeProvider = dependencies.timeProvider ?? new SystemTimeProvider();
    this.configuration = dependencies.configuration;
    this.telemetry = dependencies.telemetry;
    this.policies.set('fixed-interval', new FixedIntervalPolicy());
  }

  public registerScheduler(scheduler: { id?: string; name?: string; queueAdapter?: QueueAdapter; dependencies?: { id?: string; name?: string; queueAdapter?: QueueAdapter } }): void {
    const schedulerId = scheduler.id ?? scheduler.dependencies?.id ?? 'unnamed-scheduler';
    const schedulerName = scheduler.name ?? scheduler.dependencies?.name ?? schedulerId;
    const queueAdapter = scheduler.queueAdapter ?? scheduler.dependencies?.queueAdapter ?? this.queueAdapter;

    if (!schedulerId.trim()) {
      throw new SchedulerConfigurationError('Scheduler id is required.', { executionStage: 'registration' });
    }

    this.schedulers.set(schedulerId, {
      id: schedulerId,
      name: schedulerName,
      queueAdapter,
    });
    this.emit('SchedulerStarted', { schedulerId, schedulerName });
  }

  public registerTrigger(trigger: SchedulerTriggerContract): void {
    if (this.registry.has(trigger.id)) {
      throw new ScheduleConflictError(`Trigger already registered: ${trigger.id}`, { triggerId: trigger.id, executionStage: 'registration' });
    }

    this.registry.set(trigger.id, trigger);
    this.emit('TriggerCreated', { triggerId: trigger.id, feedId: trigger.feedId });
  }

  public getQueueAdapter(): QueueAdapter {
    return this.queueAdapter;
  }

  public async evaluateTrigger(triggerId: string): Promise<SchedulerContext> {
    const trigger = this.registry.get(triggerId);
    if (!trigger) {
      throw new SchedulerConfigurationError(`Trigger not found: ${triggerId}`, { triggerId, executionStage: 'evaluation' });
    }

    const policy = this.resolvePolicy(trigger.policyId);
    const context = trigger.createContext('runtime', trigger.policyId, this.timeProvider, 'scheduled');
    const result = trigger.evaluate(context, policy, this.timeProvider);

    if (!result.shouldTrigger) {
      this.emit('TriggerSkipped', { triggerId, reason: result.reason });
      return context;
    }

    this.emit('TriggerScheduled', { triggerId, scheduleAt: result.scheduleAt, delayMs: result.delayMs });
    return context;
  }

  public async dispatchTrigger(triggerId: string): Promise<boolean> {
    const trigger = this.registry.get(triggerId);
    if (!trigger) {
      throw new SchedulerConfigurationError(`Trigger not found: ${triggerId}`, { triggerId, executionStage: 'dispatch' });
    }

    const policy = this.resolvePolicy(trigger.policyId);
    const context = trigger.createContext('runtime', trigger.policyId, this.timeProvider, 'dispatched');
    const evaluation = trigger.evaluate(context, policy, this.timeProvider);

    try {
      const job: QueueJobEnvelope = {
        jobId: `${trigger.id}-${context.executionId}`,
        jobType: 'custom',
        correlationId: trigger.correlationId,
        feedId: trigger.feedId,
        priority: 'normal',
        queueName: 'rss-scheduler',
        payload: {
          triggerId: trigger.id,
          kind: trigger.kind,
          payload: trigger.payload,
          context,
          evaluation,
        },
        metadata: { triggerId: trigger.id, policyId: trigger.policyId, kind: trigger.kind },
        creationTime: this.timeProvider.now(),
        retryPolicy: { attempts: 1, backoffMs: 0, maxDelayMs: 0, strategy: 'fixed' },
        timeoutMs: 5000,
        version: 1,
        state: 'created',
        delayMs: Math.max(0, evaluation.delayMs),
      };

      await this.queueAdapter.enqueue(job);
      this.emit('TriggerDispatched', { triggerId: trigger.id, queueName: job.queueName });
      return true;
    } catch (error) {
      throw new TriggerDispatchError('Failed to dispatch trigger.', {
        triggerId: trigger.id,
        correlationId: trigger.correlationId,
        policyId: trigger.policyId,
        executionStage: 'dispatch',
        recoveryRecommendation: 'Verify queue adapter connectivity and job envelope validity.',
        context: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  public registerPolicy(policy: SchedulingPolicyContract): void {
    this.policies.set(policy.id, policy);
  }

  public createTrigger(definition: SchedulerTriggerDefinition): SchedulerTriggerContract {
    const trigger = this.resolveTrigger(definition);
    this.registry.set(trigger.id, trigger);
    return trigger;
  }

  public getEvents(): readonly ReturnType<typeof createSchedulerLifecycleEvent>[] {
    return [...this.events];
  }

  private resolvePolicy(policyId: string): SchedulingPolicyContract | undefined {
    return this.policies.get(policyId) ?? this.policies.get('fixed-interval');
  }

  private resolveTrigger(definition: SchedulerTriggerDefinition): SchedulerTriggerContract {
    switch (definition.triggerType) {
      case 'manual':
        return new ManualTrigger(definition as ConstructorParameters<typeof ManualTrigger>[0]);
      case 'cron':
        return new CronTrigger(definition as ConstructorParameters<typeof CronTrigger>[0]);
      case 'one-time':
        return new OneTimeTrigger(definition as ConstructorParameters<typeof OneTimeTrigger>[0]);
      case 'recurring':
        return new RecurringTrigger(definition as ConstructorParameters<typeof RecurringTrigger>[0]);
      case 'interval':
        return new IntervalTrigger(definition as ConstructorParameters<typeof IntervalTrigger>[0]);
      default:
        return new ManualTrigger(definition as ConstructorParameters<typeof ManualTrigger>[0]);
    }
  }

  private emit(type: string, payload: Record<string, unknown>): void {
    this.events.push(createSchedulerLifecycleEvent(type, payload));
    this.telemetry?.emitEvent?.(type, payload, { scheduler: 'rss' });
  }
}
