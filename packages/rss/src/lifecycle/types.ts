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

export type FeedLifecycleTransitionType = 'automatic' | 'administrative' | 'failure' | 'recovery';

export interface FeedLifecycleTransitionDefinition {
  readonly id: string;
  readonly from: FeedLifecycleState;
  readonly to: FeedLifecycleState;
  readonly category: 'automatic' | 'administrative' | 'failure' | 'recovery';
  readonly description: string;
  readonly operationalIntent: string;
  readonly transitionType: FeedLifecycleTransitionType;
  readonly visibility: 'internal' | 'external';
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
  readonly FeedLifecycleState[]
>;
