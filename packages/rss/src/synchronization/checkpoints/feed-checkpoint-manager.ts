import type { FeedCheckpoint, FeedSynchronizationState } from '../types';
import type { FeedCheckpointStore } from '../interfaces';
import { createCheckpointValidationError, createCheckpointNotFoundError, createStateVersionMismatchError } from '../errors';

export class FeedCheckpointManager implements FeedCheckpointStore {
  private readonly checkpoints = new Map<string, FeedCheckpoint>();
  private readonly history = new Map<string, FeedCheckpoint[]>();

  public createCheckpoint(state: FeedSynchronizationState, metadata: Record<string, unknown> = {}): FeedCheckpoint {
    this.validateState(state);
    const version = Math.max(1, state.currentVersion);
    const checkpointId = `checkpoint:${state.feedId}:${version}`;
    const checkpoint = Object.freeze({
      id: checkpointId,
      feedId: state.feedId,
      version,
      synchronizationVersion: version,
      metadata: Object.freeze({ ...state.metadata, ...metadata }),
      createdAt: Date.now(),
      valid: true,
      ...(metadata.etag || state.metadata.etag ? { etag: (metadata.etag as string | undefined) ?? (state.metadata.etag as string | undefined) } : {}),
      ...(metadata.lastModified || state.metadata.lastModified ? { lastModified: (metadata.lastModified as string | undefined) ?? (state.metadata.lastModified as string | undefined) } : {}),
      ...(metadata.feedHash || state.metadata.feedHash ? { feedHash: (metadata.feedHash as string | undefined) ?? (state.metadata.feedHash as string | undefined) } : {}),
      ...(metadata.episodeCount || state.metadata.episodeCount ? { episodeCount: (metadata.episodeCount as number | undefined) ?? (state.metadata.episodeCount as number | undefined) } : {}),
      ...(metadata.lastEpisodeId || state.metadata.lastEpisodeId ? { lastEpisodeId: (metadata.lastEpisodeId as string | undefined) ?? (state.metadata.lastEpisodeId as string | undefined) } : {}),
      ...(metadata.lastEpisodePublicationDate || state.metadata.lastEpisodePublicationDate ? { lastEpisodePublicationDate: (metadata.lastEpisodePublicationDate as string | undefined) ?? (state.metadata.lastEpisodePublicationDate as string | undefined) } : {}),
      ...(metadata.synchronizationCursor || state.metadata.synchronizationCursor ? { synchronizationCursor: (metadata.synchronizationCursor as string | undefined) ?? (state.metadata.synchronizationCursor as string | undefined) } : {}),
      ...(metadata.snapshotHash || state.metadata.snapshotHash ? { snapshotHash: (metadata.snapshotHash as string | undefined) ?? (state.metadata.snapshotHash as string | undefined) } : {}),
    }) as FeedCheckpoint;
    this.checkpoints.set(checkpointId, checkpoint);
    const historyEntries = this.history.get(state.feedId) ?? [];
    this.history.set(state.feedId, [...historyEntries, checkpoint]);
    return checkpoint;
  }

  public async create(checkpoint: FeedCheckpoint): Promise<FeedCheckpoint> {
    this.checkpoints.set(checkpoint.id, checkpoint);
    const historyEntries = this.history.get(checkpoint.feedId) ?? [];
    this.history.set(checkpoint.feedId, [...historyEntries, checkpoint]);
    return checkpoint;
  }

  public restoreCheckpoint(feedId: string, checkpointId: string): FeedCheckpoint | undefined {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint || checkpoint.feedId !== feedId) {
      throw createCheckpointNotFoundError(`Checkpoint ${checkpointId} was not found for feed ${feedId}.`, { feedId, checkpointId });
    }
    return checkpoint;
  }

  public compareCheckpoints(previous: FeedCheckpoint, current: FeedCheckpoint): {
    identical: boolean;
    feedIdChanged: boolean;
    versionChanged: boolean;
    syncVersionChanged: boolean;
    hashChanged: boolean;
    cursorChanged: boolean;
    episodesChanged: boolean;
    metadataChanges: readonly string[];
  } {
    const metadataChanges = Object.keys({ ...previous.metadata, ...current.metadata }).filter((key) => previous.metadata[key] !== current.metadata[key]);
    return {
      identical: previous.id === current.id && previous.feedHash === current.feedHash && previous.synchronizationCursor === current.synchronizationCursor && previous.episodeCount === current.episodeCount && previous.version === current.version,
      feedIdChanged: previous.feedId !== current.feedId,
      versionChanged: previous.version !== current.version,
      syncVersionChanged: previous.synchronizationVersion !== current.synchronizationVersion,
      hashChanged: previous.feedHash !== current.feedHash,
      cursorChanged: previous.synchronizationCursor !== current.synchronizationCursor,
      episodesChanged: (previous.episodeCount ?? 0) !== (current.episodeCount ?? 0),
      metadataChanges,
    };
  }

  public replaceCheckpoint(feedId: string, checkpoint: FeedCheckpoint): FeedCheckpoint {
    this.validateCheckpoint(checkpoint, feedId);
    this.checkpoints.set(checkpoint.id, checkpoint);
    this.history.set(feedId, [...(this.history.get(feedId) ?? []), checkpoint]);
    return checkpoint;
  }

  public async replace(checkpoint: FeedCheckpoint): Promise<FeedCheckpoint> {
    return this.replaceCheckpoint(checkpoint.feedId, checkpoint);
  }

  public invalidateCheckpoint(checkpoint: FeedCheckpoint, reason = 'invalidated'): FeedCheckpoint {
    const invalidated = Object.freeze({
      ...checkpoint,
      valid: false,
      invalidatedAt: Date.now(),
      metadata: Object.freeze({ ...checkpoint.metadata, invalidationReason: reason }),
    }) as FeedCheckpoint;
    this.checkpoints.set(invalidated.id, invalidated);
    return invalidated;
  }

  public expireCheckpoint(checkpoint: FeedCheckpoint, now = Date.now(), ttlMs = 24 * 60 * 60 * 1000): FeedCheckpoint {
    const expired = Object.freeze({
      ...checkpoint,
      expirationAt: now + ttlMs,
      isExpired: (checkpoint.createdAt + ttlMs) <= now,
    }) as FeedCheckpoint;
    this.checkpoints.set(expired.id, expired);
    return expired;
  }

  public getHistory(feedId: string): readonly FeedCheckpoint[] {
    return [...(this.history.get(feedId) ?? [])];
  }

  public rollbackCheckpoint(state: FeedSynchronizationState, checkpoint: FeedCheckpoint): FeedSynchronizationState {
    this.validateCheckpoint(checkpoint, state.feedId);
    if (checkpoint.version !== state.currentVersion) {
      throw createStateVersionMismatchError('Checkpoint version does not match the current state version.', { feedId: state.feedId, context: { stateVersion: state.currentVersion, checkpointVersion: checkpoint.version } });
    }
    return Object.freeze({ ...state, checkpointReference: checkpoint.id, metadata: Object.freeze({ ...state.metadata, rollbackCheckpointId: checkpoint.id }) }) as FeedSynchronizationState;
  }

  public async find(feedId: string, checkpointId: string): Promise<FeedCheckpoint | undefined> {
    const checkpoint = this.checkpoints.get(checkpointId);
    return checkpoint && checkpoint.feedId === feedId ? checkpoint : undefined;
  }

  public async list(feedId: string): Promise<readonly FeedCheckpoint[]> {
    return [...(this.history.get(feedId) ?? [])];
  }

  private validateState(state: FeedSynchronizationState): void {
    if (!state.feedId) {
      throw createCheckpointValidationError('Feed identifier is required to create a checkpoint.', { feedId: state.feedId });
    }
    if (state.currentVersion < 1) {
      throw createCheckpointValidationError('State version must be at least one to create a checkpoint.', { feedId: state.feedId, version: state.currentVersion });
    }
  }

  private validateCheckpoint(checkpoint: FeedCheckpoint, feedId: string): void {
    if (!checkpoint.id || !checkpoint.feedId) {
      throw createCheckpointValidationError('Checkpoint identifier and feed identifier are required.', { feedId, checkpointId: checkpoint.id });
    }
    if (checkpoint.feedId !== feedId) {
      throw createCheckpointValidationError('Checkpoint feed identifier does not match the requested feed.', { feedId, checkpointId: checkpoint.id });
    }
  }
}
