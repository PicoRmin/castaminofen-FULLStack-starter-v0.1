import type { SchedulerContext, SchedulerPolicyEvaluationResult, SchedulerPolicyKind, SchedulerTimeProvider } from '../types';
import type { SchedulerTriggerContract } from './scheduler-trigger-contract';

export interface SchedulingPolicyContract {
  readonly id: string;
  readonly kind: SchedulerPolicyKind;
  readonly description: string;
  validate(): void;
  evaluate(context: SchedulerContext, trigger: SchedulerTriggerContract, timeProvider: SchedulerTimeProvider): SchedulerPolicyEvaluationResult;
}
