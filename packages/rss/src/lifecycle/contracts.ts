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
