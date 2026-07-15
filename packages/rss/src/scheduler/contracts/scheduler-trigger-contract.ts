import type {
  SchedulerContext,
  SchedulerPolicyEvaluationResult,
  SchedulerTimeProvider,
  SchedulerTriggerKind,
} from '../types';
import type { SchedulingPolicyContract } from './scheduling-policy-contract';

export interface SchedulerTriggerContract<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly feedId: string;
  readonly correlationId: string;
  readonly kind: SchedulerTriggerKind;
  readonly policyId: string;
  readonly priority: number;
  readonly payload: TPayload | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly nextRunAt: number;
  readonly scheduleName: string;
  readonly configuration: Readonly<Record<string, unknown>>;
  readonly expression: string | undefined;
  readonly timezone: string | undefined;
  evaluate(
    context: SchedulerContext,
    policy: SchedulingPolicyContract | undefined,
    timeProvider: SchedulerTimeProvider,
  ): SchedulerPolicyEvaluationResult;
  createContext(
    schedulerId: string,
    policyId: string,
    timeProvider: SchedulerTimeProvider,
    state?: string,
  ): SchedulerContext;
}
