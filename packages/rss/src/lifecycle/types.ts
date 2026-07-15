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
