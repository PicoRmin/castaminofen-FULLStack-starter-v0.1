import type { FeedCheckpoint, FeedSynchronizationProgress, FeedSynchronizationSnapshot, FeedSynchronizationState, FeedSynchronizationWarning, FeedStateHistoryEntry, FeedSynchronizationLifecycleState } from '../types';
import type { FeedCheckpointManagerLike, FeedStateManagerDependencies, FeedStateMachineLike, FeedStateStore } from '../interfaces';
import { createFeedStateTransitionError, createFeedStateValidationError, createSnapshotCreationError, createStateConsistencyError } from '../errors';
import type { FeedStateLifecycleHooks } from '../events';

export class FeedStateManager {
  private readonly checkpointManager: FeedCheckpointManagerLike;
  private readonly stateMachine: FeedStateMachineLike;
  private readonly hooks: FeedStateLifecycleHooks | undefined;
  private readonly stateStore: FeedStateStore | undefined;

  public constructor(dependencies: FeedStateManagerDependencies = {}) {
    this.checkpointManager = dependencies.checkpointManager ?? ({
      createCheckpoint: () => ({ id: 'checkpoint-default', feedId: 'unknown', version: 1, synchronizationVersion: 1, metadata: {}, createdAt: Date.now(), valid: true }),
      restoreCheckpoint: () => undefined,
      compareCheckpoints: (previous, current) => ({ identical: previous.id === current.id, feedIdChanged: previous.feedId !== current.feedId, versionChanged: previous.version !== current.version, syncVersionChanged: previous.synchronizationVersion !== current.synchronizationVersion, hashChanged: previous.feedHash !== current.feedHash, cursorChanged: previous.synchronizationCursor !== current.synchronizationCursor, episodesChanged: (previous.episodeCount ?? 0) !== (current.episodeCount ?? 0), metadataChanges: [] }),
      replaceCheckpoint: (_feedId, checkpoint) => checkpoint,
      invalidateCheckpoint: (checkpoint) => ({ ...checkpoint, valid: false, invalidatedAt: Date.now() }),
      expireCheckpoint: (checkpoint, now = Date.now(), ttlMs = 24 * 60 * 60 * 1000) => ({ ...checkpoint, expirationAt: now + ttlMs, isExpired: (checkpoint.createdAt + ttlMs) <= now }),
      getHistory: () => [],
      rollbackCheckpoint: (state) => state,
    } as FeedCheckpointManagerLike);
    this.stateMachine = dependencies.stateMachine ?? ({
      transition: (fromState, toState) => {
        if (fromState === toState) {
          return toState;
        }
        throw createFeedStateTransitionError(`Invalid state transition from ${fromState} to ${toState}.`, { fromState, toState });
      },
      canTransition: () => false,
      validate: () => true,
    } as FeedStateMachineLike);
    this.hooks = dependencies.hooks;
    this.stateStore = dependencies.stateStore;
  }

  public createState(feedId: string, correlationId?: string, metadata: Record<string, unknown> = {}): FeedSynchronizationState {
    const now = Date.now();
    const state: FeedSynchronizationState = {
      id: `state:${feedId}`,
      feedId,
      ...(correlationId ? { correlationId } : {}),
      currentState: 'NeverSynced',
      currentVersion: 1,
      failureCount: 0,
      successCount: 0,
      metadata: Object.freeze({ ...metadata }),
      stateTimestamp: now,
      history: [],
      failureHistory: [],
      successHistory: [],
      warnings: [],
    };
    void this.hooks?.onStateCreated?.({ type: 'state-created', state, timestamp: now });
    return Object.freeze(state) as FeedSynchronizationState;
  }

  public async restoreState(feedId: string, options: { state?: FeedSynchronizationState; checkpoint?: FeedCheckpoint; metadata?: Record<string, unknown> } = {}): Promise<FeedSynchronizationState> {
    const correlationId = options.metadata?.correlationId as string | undefined;
    const persistedState = options.state ?? (await this.stateStore?.load({ feedId, ...(correlationId ? { correlationId } : {}) }));
    if (!persistedState) {
      const state = this.createState(feedId, correlationId, options.metadata);
      return this.attachCheckpoint(state, options.checkpoint);
    }
    const restored = this.mergeState(persistedState, options.checkpoint, options.metadata);
    this.validateStateIntegrity(restored);
    void this.hooks?.onStateUpdated?.({ type: 'state-restored', state: restored, timestamp: Date.now() });
    return restored;
  }

  public updateState(state: FeedSynchronizationState, nextState: string, metadata: Record<string, unknown> = {}): FeedSynchronizationState {
    const normalizedNextState = this.normalizeStateName(nextState);
    const previousState = state.currentState;
    if (!this.stateMachine.canTransition(previousState, normalizedNextState)) {
      throw createFeedStateTransitionError(`Invalid state transition from ${previousState} to ${normalizedNextState}.`, { fromState: previousState, toState: normalizedNextState, feedId: state.feedId });
    }
    const nextVersion = state.currentVersion + 1;
    const now = Date.now();
    const entry = {
      previousState,
      currentState: normalizedNextState as FeedSynchronizationLifecycleState,
      transitionedAt: now,
      ...(typeof metadata.reason === 'string' ? { reason: metadata.reason } : {}),
      ...(state.checkpointReference ? { checkpointReference: state.checkpointReference } : {}),
      ...(state.correlationId ? { correlationId: state.correlationId } : {}),
      metadata: Object.freeze({ ...metadata }),
    } as FeedStateHistoryEntry;
    const updated: FeedSynchronizationState = {
      ...state,
      currentState: normalizedNextState as FeedSynchronizationLifecycleState,
      previousState,
      currentVersion: nextVersion,
      lastAttempt: now,
      stateTimestamp: now,
      history: [...state.history, entry],
      metadata: Object.freeze({ ...state.metadata, ...metadata }),
      warnings: [...state.warnings],
    };
    void this.hooks?.onStateUpdated?.({ type: 'state-updated', state: updated, timestamp: now });
    void this.hooks?.onTransitionCompleted?.({ type: 'transition-completed', state: { fromState: previousState, toState: normalizedNextState }, timestamp: now });
    return Object.freeze(updated) as FeedSynchronizationState;
  }

  public createCheckpoint(state: FeedSynchronizationState, metadata: Record<string, unknown> = {}): FeedCheckpoint {
    const checkpoint = this.checkpointManager.createCheckpoint(state, metadata);
    void this.hooks?.onCheckpointCreated?.({ type: 'checkpoint-created', checkpoint, timestamp: Date.now() });
    return checkpoint;
  }

  public createSnapshot(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint, metadata: Record<string, unknown> = {}): FeedSynchronizationSnapshot {
    const stateFrozen = this.normalizeState(state);
    const snapshotId = `snapshot:${state.feedId}:${state.currentVersion}`;
    const warnings = this.collectWarnings(state, checkpoint);
    const snapshot = {
      id: snapshotId,
      state: stateFrozen,
      ...(checkpoint?.id || state.checkpointReference ? { checkpointReference: checkpoint?.id ?? state.checkpointReference } : {}),
      metadata: Object.freeze({ ...metadata, feedId: state.feedId, currentState: state.currentState, correlationId: state.correlationId }),
      statistics: Object.freeze({ version: state.currentVersion, failureCount: state.failureCount, successCount: state.successCount, hasCheckpoint: Boolean(checkpoint) }),
      warnings,
      createdAt: Date.now(),
    } as FeedSynchronizationSnapshot;
    void this.hooks?.onSnapshotCreated?.({ type: 'snapshot-created', snapshot, timestamp: snapshot.createdAt });
    return Object.freeze(snapshot) as FeedSynchronizationSnapshot;
  }

  public evaluateProgress(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint): FeedSynchronizationProgress {
    const warnings = this.collectWarnings(state, checkpoint);
    const progressPercent = state.currentState === 'Completed' ? 100 : state.currentState === 'Running' ? 65 : state.currentState === 'Persisting' ? 85 : state.currentState === 'Pending' ? 15 : state.currentState === 'Preparing' ? 30 : state.currentState === 'Failed' ? 0 : 5;
    return {
      state: state.currentState,
      progressPercent,
      hasCheckpoint: Boolean(checkpoint ?? state.checkpointReference),
      checkpointValid: checkpoint?.valid ?? true,
      isHealthy: warnings.every((warning) => warning.severity !== 'warning'),
      warnings,
    };
  }

  private attachCheckpoint(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint): FeedSynchronizationState {
    if (!checkpoint) {
      return state;
    }
    const withCheckpoint: FeedSynchronizationState = {
      ...state,
      checkpointReference: checkpoint.id,
      metadata: Object.freeze({ ...state.metadata, checkpointId: checkpoint.id }),
    };
    return Object.freeze(withCheckpoint) as FeedSynchronizationState;
  }

  private mergeState(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint, metadata?: Record<string, unknown>): FeedSynchronizationState {
    const merged = {
      ...state,
      checkpointReference: checkpoint?.id ?? state.checkpointReference,
      metadata: Object.freeze({ ...state.metadata, ...(metadata ?? {}) }),
      history: [...state.history],
      failureHistory: [...state.failureHistory],
      successHistory: [...state.successHistory],
      warnings: [...state.warnings],
    };
    return Object.freeze(merged) as FeedSynchronizationState;
  }

  private normalizeStateName(stateName: string): FeedSynchronizationLifecycleState {
    const normalized = stateName as FeedSynchronizationLifecycleState;
    if (!['NeverSynced', 'Pending', 'Preparing', 'Running', 'Persisting', 'Completed', 'Failed', 'Cancelled', 'Paused', 'Outdated', 'Unchanged'].includes(normalized)) {
      throw createFeedStateTransitionError(`Unsupported state name ${stateName}.`, { stateName });
    }
    return normalized;
  }

  private normalizeState(state: FeedSynchronizationState): FeedSynchronizationState {
    return Object.freeze({
      ...state,
      metadata: Object.freeze({ ...state.metadata }),
      history: [...state.history],
      failureHistory: [...state.failureHistory],
      successHistory: [...state.successHistory],
      warnings: [...state.warnings],
    }) as FeedSynchronizationState;
  }

  private collectWarnings(state: FeedSynchronizationState, checkpoint?: FeedCheckpoint): FeedSynchronizationWarning[] {
    const warnings: FeedSynchronizationWarning[] = [];
    if (checkpoint && checkpoint.valid === false) {
      warnings.push({ code: 'checkpoint-invalidated', message: 'Checkpoint was invalidated and should be re-created.', severity: 'warning', createdAt: Date.now(), context: { checkpointId: checkpoint.id } });
    }
    if (state.currentState === 'Outdated') {
      warnings.push({ code: 'outdated-checkpoint', message: 'State is marked as outdated.', severity: 'warning', createdAt: Date.now(), context: { feedId: state.feedId } });
    }
    if (!state.metadata?.etag && !state.metadata?.lastModified && !state.metadata?.feedHash) {
      warnings.push({ code: 'missing-optional-metadata', message: 'Optional synchronization metadata is missing.', severity: 'info', createdAt: Date.now(), context: { feedId: state.feedId } });
    }
    if (checkpoint && checkpoint.version !== state.currentVersion) {
      warnings.push({ code: 'version-mismatch', message: 'Checkpoint version does not match current state version.', severity: 'warning', createdAt: Date.now(), context: { checkpointId: checkpoint.id, stateVersion: state.currentVersion } });
    }
    if (checkpoint?.expirationAt && checkpoint.expirationAt <= Date.now()) {
      warnings.push({ code: 'expired-checkpoint', message: 'Checkpoint has expired.', severity: 'warning', createdAt: Date.now(), context: { checkpointId: checkpoint.id } });
    }
    return warnings;
  }

  private validateStateIntegrity(state: FeedSynchronizationState): void {
    if (!state.feedId) {
      throw createFeedStateValidationError('Feed identifier is required.', { feedId: state.feedId });
    }
    if (state.currentVersion < 1) {
      throw createStateConsistencyError('State version must be positive.', { feedId: state.feedId, version: state.currentVersion });
    }
    if (state.lastAttempt && state.stateTimestamp > state.lastAttempt) {
      throw createStateConsistencyError('State timestamp must not precede the last attempt timestamp.', { feedId: state.feedId, context: { stateTimestamp: state.stateTimestamp, lastAttempt: state.lastAttempt } });
    }
  }
}
