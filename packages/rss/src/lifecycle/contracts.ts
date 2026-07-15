import type {
  FeedLifecycleStateMetadata,
  FeedLifecycleTransitionDefinition,
  FeedLifecycleTransitionRequest,
} from './types';

export type TransitionValidationCategory =
  | 'structural'
  | 'lifecycle'
  | 'repository'
  | 'integrity'
  | 'metadata'
  | 'operational'
  | 'security'
  | 'administrative'
  | 'future-worker'
  | 'future-scheduler';

export type TransitionGuardCategory =
  | 'lifecycle'
  | 'administrative'
  | 'recovery'
  | 'repository'
  | 'integrity'
  | 'operational'
  | 'security'
  | 'future-policy';

export type LifecyclePolicyCategory =
  | 'operational'
  | 'administrative'
  | 'security'
  | 'scheduling'
  | 'recovery'
  | 'synchronization'
  | 'maintenance'
  | 'configuration'
  | 'feature-flag'
  | 'future-subscription'
  | 'future-multi-tenant';

export interface TransitionValidationContext {
  readonly request: FeedLifecycleTransitionRequest;
  readonly transitionDefinition?: FeedLifecycleTransitionDefinition;
  readonly fromMetadata?: FeedLifecycleStateMetadata;
  readonly toMetadata?: FeedLifecycleStateMetadata;
}

export interface TransitionValidationResult {
  readonly success: boolean;
  readonly identifier: string;
  readonly category: TransitionValidationCategory;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
  readonly context: TransitionValidationContext;
}

export interface TransitionValidationDefinition {
  readonly id: string;
  readonly category: TransitionValidationCategory;
  readonly description: string;
  readonly validate: (context: TransitionValidationContext) => TransitionValidationResult;
}

export interface TransitionGuardContext {
  readonly request: FeedLifecycleTransitionRequest;
  readonly transitionDefinition?: FeedLifecycleTransitionDefinition;
  readonly fromMetadata?: FeedLifecycleStateMetadata;
  readonly toMetadata?: FeedLifecycleStateMetadata;
}

export interface TransitionGuardResult {
  readonly allowed: boolean;
  readonly guardId: string;
  readonly transition: string;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
  readonly context: TransitionGuardContext;
}

export interface TransitionGuardDefinition {
  readonly id: string;
  readonly category: TransitionGuardCategory;
  readonly description: string;
  readonly evaluate: (context: TransitionGuardContext) => TransitionGuardResult;
}

export interface LifecyclePolicyContext {
  readonly request: FeedLifecycleTransitionRequest;
  readonly transitionDefinition: FeedLifecycleTransitionDefinition | undefined;
  readonly fromMetadata: FeedLifecycleStateMetadata | undefined;
  readonly toMetadata: FeedLifecycleStateMetadata | undefined;
  readonly guardResult: TransitionGuardResult | undefined;
  readonly validationResult: TransitionValidationResult | undefined;
  readonly configuration: Record<string, unknown> | undefined;
  readonly environment: Record<string, unknown> | undefined;
  readonly featureFlags: Record<string, boolean> | undefined;
  readonly repositorySnapshot: Record<string, unknown> | undefined;
  readonly metadata: Record<string, unknown> | undefined;
}

export interface LifecyclePolicyResult {
  readonly allowed: boolean;
  readonly status: 'allowed' | 'rejected' | 'deferred' | 'warning';
  readonly policyId: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: LifecyclePolicyCategory;
  readonly priority: number;
  readonly executionOrder: number;
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
  readonly failureReason: string | undefined;
  readonly retryHint: string | undefined;
  readonly notificationHint: string | undefined;
  readonly auditMetadata: Record<string, unknown> | undefined;
  readonly loggingMetadata: Record<string, unknown> | undefined;
}

export interface LifecyclePolicyDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: LifecyclePolicyCategory;
  readonly priority: number;
  readonly executionOrder: number;
  readonly metadata?: Record<string, unknown>;
  readonly evaluate: (context: LifecyclePolicyContext) => LifecyclePolicyResult;
}

export interface LifecyclePolicyEvaluationResult {
  readonly allowed: boolean;
  readonly status: 'allowed' | 'rejected' | 'deferred' | 'warning';
  readonly reason: string;
  readonly code: string;
  readonly metadata: Record<string, unknown>;
  readonly policyResults: readonly LifecyclePolicyResult[];
}
