export type SchedulerTriggerKind =
  | 'cron'
  | 'manual'
  | 'one-time'
  | 'recurring'
  | 'interval'
  | 'immediate'
  | 'delayed'
  | 'recovery'
  | 'retry'
  | 'health'
  | 'maintenance'
  | 'metrics'
  | 'custom';

export type SchedulerTriggerLifecycleState =
  | 'created'
  | 'scheduled'
  | 'waiting'
  | 'triggered'
  | 'dispatched'
  | 'skipped'
  | 'cancelled'
  | 'expired'
  | 'completed';

export type SchedulerPolicyKind =
  | 'fixed-interval'
  | 'cron-expression'
  | 'adaptive'
  | 'exponential-backoff'
  | 'priority'
  | 'maintenance-window'
  | 'business-hours'
  | 'off-peak'
  | 'randomized'
  | 'custom';

export interface SchedulerConfiguration {
  readonly cronExpressions?: Readonly<Record<string, string>>;
  readonly intervals?: Readonly<Record<string, number>>;
  readonly delays?: Readonly<Record<string, number>>;
  readonly priorities?: Readonly<Record<string, number>>;
  readonly concurrencyLimits?: Readonly<Record<string, number>>;
  readonly maintenanceWindows?: ReadonlyArray<readonly [string, string]>;
  readonly retryDelays?: ReadonlyArray<number>;
  readonly recoveryWindows?: Readonly<Record<string, number>>;
  readonly timezone?: string;
  readonly jitter?: number;
  readonly featureFlags?: Readonly<Record<string, boolean>>;
}

export interface SchedulerTimeProvider {
  readonly now: () => number;
}

export class SystemTimeProvider implements SchedulerTimeProvider {
  public readonly now = (): number => Date.now();
}

export interface SchedulerContext {
  readonly schedulerId: string;
  readonly triggerId: string;
  readonly feedId: string;
  readonly correlationId: string;
  readonly executionId: string;
  readonly policyId: string;
  readonly scheduleName: string;
  readonly priority: number;
  readonly creationTimestamp: number;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly triggerKind: SchedulerTriggerKind;
  readonly state: SchedulerTriggerLifecycleState;
  readonly scheduledFor: number;
  readonly policyKind: SchedulerPolicyKind;
}

export interface SchedulerPolicyEvaluationResult {
  readonly shouldTrigger: boolean;
  readonly reason: string;
  readonly priority: number;
  readonly delayMs: number;
  readonly scheduleAt: number;
}

export interface SchedulerTriggerDefinition<TPayload = unknown> {
  readonly id: string;
  readonly name: string;
  readonly feedId: string;
  readonly correlationId?: string;
  readonly policyId?: string;
  readonly triggerType: SchedulerTriggerKind;
  readonly priority?: number;
  readonly payload?: TPayload;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly nextRunAt?: number;
  readonly scheduleName?: string;
  readonly configuration?: SchedulerConfiguration;
  readonly expression?: string;
  readonly timezone?: string;
}

export interface SchedulerDispatchPlan {
  readonly queueName: string;
  readonly delayMs: number;
  readonly expiresAt?: number;
}

export interface SchedulerRuntimeDependencies {
  readonly registry?: unknown;
  readonly queueAdapter: import('../../queue/interfaces/queue-adapter').QueueAdapter;
  readonly timeProvider?: SchedulerTimeProvider;
  readonly configuration?: SchedulerConfiguration;
  readonly telemetry?: {
    readonly emitEvent?: (type: string, payload?: Record<string, unknown>, metadata?: Record<string, unknown>) => void;
  };
}
