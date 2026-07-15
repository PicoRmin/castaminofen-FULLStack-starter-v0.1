import type { SchedulerContext as SchedulerContextShape, SchedulerPolicyKind, SchedulerTriggerKind, SchedulerTriggerLifecycleState } from '../types';

export class SchedulerContextFactory {
  public createContext(params: {
    readonly schedulerId: string;
    readonly triggerId: string;
    readonly feedId: string;
    readonly correlationId: string;
    readonly executionId: string;
    readonly policyId: string;
    readonly scheduleName: string;
    readonly priority: number;
    readonly creationTimestamp: number;
    readonly metadata?: Readonly<Record<string, unknown>>;
    readonly triggerKind: SchedulerTriggerKind;
    readonly state: SchedulerTriggerLifecycleState;
    readonly scheduledFor: number;
    readonly policyKind: SchedulerPolicyKind;
  }): SchedulerContextShape {
    return Object.freeze({
      schedulerId: params.schedulerId,
      triggerId: params.triggerId,
      feedId: params.feedId,
      correlationId: params.correlationId,
      executionId: params.executionId,
      policyId: params.policyId,
      scheduleName: params.scheduleName,
      priority: params.priority,
      creationTimestamp: params.creationTimestamp,
      metadata: params.metadata ? Object.freeze({ ...params.metadata }) : Object.freeze({}),
      triggerKind: params.triggerKind,
      state: params.state,
      scheduledFor: params.scheduledFor,
      policyKind: params.policyKind,
    });
  }
}
