import type { FeedStatus } from '../status';

export type FeedLifecycleState = FeedStatus;

export interface FeedLifecycleTransitionRequest {
  readonly feedId: string;
  readonly currentState: FeedLifecycleState | string;
  readonly targetState: FeedLifecycleState | string;
  readonly actor?: string;
  readonly reason?: string;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface FeedLifecycleTransition {
  readonly feedId: string;
  readonly previousState: FeedLifecycleState;
  readonly nextState: FeedLifecycleState;
  readonly actor: string;
  readonly reason: string;
  readonly timestamp: number;
  readonly correlationId: string | undefined;
  readonly metadata: Record<string, unknown>;
}

export interface FeedLifecycleTransitionResult {
  readonly allowed: boolean;
  readonly previousState: FeedLifecycleState;
  readonly nextState: FeedLifecycleState;
  readonly reason: string;
  readonly actor: string;
  readonly timestamp: number;
  readonly correlationId: string | undefined;
  readonly metadata: Record<string, unknown>;
}

export interface FeedLifecycleAggregateMutation {
  readonly previousState: FeedLifecycleState;
  readonly nextState: FeedLifecycleState;
  readonly reason: string;
  readonly actor: string;
  readonly timestamp: number;
  readonly correlationId: string | undefined;
  readonly metadata: Record<string, unknown>;
}

export interface FeedLifecycleAggregate {
  readonly id: string;
  readonly status?: string;
  readonly state?: string;
  readonly currentState?: string;
  readonly lifecycleState?: string;
  readonly version?: number;
  applyLifecycleTransition(input: FeedLifecycleAggregateMutation): void;
}

export interface FeedLifecycleRepository {
  load?(id: string): Promise<FeedLifecycleAggregate | undefined>;
  save?(aggregate: FeedLifecycleAggregate): Promise<FeedLifecycleAggregate>;
}

export interface FeedLifecycleExecutionPlan {
  readonly executionStrategy?: string;
  readonly executionMode?: string;
  readonly stages?: readonly unknown[];
  readonly dependencies?: readonly unknown[];
  readonly executionId?: string;
  readonly correlationId?: string;
}

export interface FeedLifecycleDomainFailure {
  readonly code: string;
  readonly message: string;
  readonly details: Record<string, unknown>;
}

export interface FeedLifecycleDomainResult {
  readonly success: boolean;
  readonly aggregateId: string;
  readonly previousState: FeedLifecycleState;
  readonly currentState: FeedLifecycleState;
  readonly transitionMetadata: Record<string, unknown>;
  readonly executionMetadata: Record<string, unknown>;
  readonly futureEventMetadata: Record<string, unknown>;
  readonly futureAuditMetadata: Record<string, unknown>;
  readonly futureMetricsMetadata: Record<string, unknown>;
  readonly futureLoggingMetadata: Record<string, unknown>;
  readonly repositoryUpdated: boolean;
  readonly failure?: FeedLifecycleDomainFailure;
}

export interface FeedLifecycleLogger {
  readonly info?: (message: string, context?: Record<string, unknown>) => void;
  readonly warn?: (message: string, context?: Record<string, unknown>) => void;
  readonly error?: (message: string, context?: Record<string, unknown>) => void;
}

export interface FeedLifecycleHooks {
  readonly onTransitionStarted?: (event: FeedLifecycleTransition) => void | Promise<void>;
  readonly onTransitionCompleted?: (event: FeedLifecycleTransition) => void | Promise<void>;
  readonly onTransitionRejected?: (event: {
    feedId: string;
    previousState: FeedLifecycleState;
    targetState: FeedLifecycleState;
    reason: string;
    actor: string;
    timestamp: number;
    metadata: Record<string, unknown>;
  }) => void | Promise<void>;
}

export type FeedLifecycleTransitionCategory =
  | 'lifecycle'
  | 'operational'
  | 'administrative'
  | 'recovery'
  | 'failure'
  | 'system'
  | 'user-initiated'
  | 'automated'
  | 'scheduled'
  | 'background';

export type FeedLifecycleTransitionType =
  'normal' | 'failure' | 'recovery' | 'maintenance' | 'administrative' | 'migration' | 'terminal';

export type FeedLifecycleTransitionVisibility = 'public' | 'internal' | 'administrative' | 'system';

export interface FeedLifecycleTransitionDefinition {
  readonly id: string;
  readonly from: FeedLifecycleState;
  readonly to: FeedLifecycleState;
  readonly displayName: string;
  readonly description: string;
  readonly category: FeedLifecycleTransitionCategory;
  readonly operationalIntent: string;
  readonly transitionType: FeedLifecycleTransitionType;
  readonly visibility: FeedLifecycleTransitionVisibility;
  readonly severity: 'info' | 'warning' | 'error' | 'success';
  readonly priority: number;
  readonly recoverable: boolean;
  readonly terminal: boolean;
  readonly requiresValidation: boolean;
  readonly supportsRetry: boolean;
  readonly supportsRecovery: boolean;
  readonly supportsScheduling: boolean;
  readonly supportsAutomation: boolean;
  readonly futureEventName: string | undefined;
  readonly futureMetricName: string | undefined;
  readonly futureAuditName: string | undefined;
  readonly futureNotificationName: string | undefined;
  readonly futureQueueName: string | undefined;
}

export interface FeedLifecycleStateMetadata {
  readonly code: FeedLifecycleState;
  readonly displayName: string;
  readonly description: string;
  readonly classification:
    'initial' | 'operational' | 'temporary' | 'failure' | 'administrative' | 'terminal';
  readonly terminal: boolean;
  readonly recoverable: boolean;
  readonly operationalCategory: 'draft' | 'validation' | 'operational' | 'inactive' | 'terminal';
}

export interface FeedLifecycleStateMachine {
  canTransition(
    fromState: FeedLifecycleState | string,
    toState: FeedLifecycleState | string,
  ): boolean;
  transition(
    fromState: FeedLifecycleState | string,
    toState: FeedLifecycleState | string,
  ): FeedLifecycleState;
  getMetadata(state: FeedLifecycleState | string): FeedLifecycleStateMetadata | undefined;
  getTransitions(state: FeedLifecycleState | string): readonly FeedLifecycleState[];
}

export type FeedLifecycleTransitionRegistry = Map<
  FeedLifecycleState,
  readonly FeedLifecycleTransitionDefinition[]
>;
