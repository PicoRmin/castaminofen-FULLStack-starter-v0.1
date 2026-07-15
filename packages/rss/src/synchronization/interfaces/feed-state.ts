import type { FeedCheckpoint, FeedCheckpointComparison, FeedSynchronizationState, FeedSynchronizationSnapshot, FeedSynchronizationWarning } from '../types';
import type { FeedStateLifecycleHooks } from '../events';

export interface FeedStateStore {
  load(request: { feedId: string; correlationId?: string | undefined }): Promise<FeedSynchronizationState | undefined>;
  save(state: FeedSynchronizationState): Promise<void>;
}

export interface FeedCheckpointStore {
  create(checkpoint: FeedCheckpoint): Promise<FeedCheckpoint>;
  find(feedId: string, checkpointId: string): Promise<FeedCheckpoint | undefined>;
  list(feedId: string): Promise<readonly FeedCheckpoint[]>;
  replace(checkpoint: FeedCheckpoint): Promise<FeedCheckpoint>;
}

export interface FeedStateManagerDependencies {
  readonly stateStore?: FeedStateStore;
  readonly checkpointManager?: FeedCheckpointManagerLike;
  readonly stateMachine?: FeedStateMachineLike;
  readonly hooks?: FeedStateLifecycleHooks;
}

export interface FeedStateManagerLike {
  createState(feedId: string, correlationId?: string, metadata?: Record<string, unknown>): FeedSynchronizationState;
  restoreState(feedId: string, options?: { state?: FeedSynchronizationState; checkpoint?: FeedCheckpoint; metadata?: Record<string, unknown> }): Promise<FeedSynchronizationState>;
  updateState(state: FeedSynchronizationState, nextState: string, metadata?: Record<string, unknown>): FeedSynchronizationState;
  createCheckpoint(state: FeedSynchronizationState, metadata?: Record<string, unknown>): FeedCheckpoint;
  createSnapshot(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint, metadata?: Record<string, unknown>): FeedSynchronizationSnapshot;
}

export interface FeedCheckpointManagerLike {
  createCheckpoint(state: FeedSynchronizationState, metadata?: Record<string, unknown>): FeedCheckpoint;
  restoreCheckpoint(feedId: string, checkpointId: string): FeedCheckpoint | undefined;
  compareCheckpoints(previous: FeedCheckpoint, current: FeedCheckpoint): FeedCheckpointComparison;
  replaceCheckpoint(feedId: string, checkpoint: FeedCheckpoint): FeedCheckpoint;
  invalidateCheckpoint(checkpoint: FeedCheckpoint, reason?: string): FeedCheckpoint;
  expireCheckpoint(checkpoint: FeedCheckpoint, now?: number, ttlMs?: number): FeedCheckpoint;
  getHistory(feedId: string): readonly FeedCheckpoint[];
  rollbackCheckpoint(state: FeedSynchronizationState, checkpoint: FeedCheckpoint): FeedSynchronizationState;
}

export interface FeedStateMachineLike {
  transition(fromState: string, toState: string): string;
  canTransition(fromState: string, toState: string): boolean;
  validate(state: FeedSynchronizationState): boolean;
}

export interface FeedStateWarningFactory {
  createWarning(code: string, message: string, severity: 'warning' | 'info', context?: Record<string, unknown>): FeedSynchronizationWarning;
}
