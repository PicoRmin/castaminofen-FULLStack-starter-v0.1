export type FeedSynchronizationLifecycleState = 'NeverSynced' | 'Pending' | 'Preparing' | 'Running' | 'Persisting' | 'Completed' | 'Failed' | 'Cancelled' | 'Paused' | 'Outdated' | 'Unchanged';

export interface FeedStateHistoryEntry {
  readonly previousState: FeedSynchronizationLifecycleState;
  readonly currentState: FeedSynchronizationLifecycleState;
  readonly transitionedAt: number;
  readonly reason?: string | undefined;
  readonly checkpointReference?: string | undefined;
  readonly correlationId?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface FeedSynchronizationFailureRecord {
  readonly code: string;
  readonly message: string;
  readonly occurredAt: number;
  readonly reason?: string | undefined;
  readonly recoveryEligible: boolean;
  readonly checkpointReference?: string | undefined;
  readonly context?: Record<string, unknown> | undefined;
}

export interface FeedSynchronizationSuccessRecord {
  readonly occurredAt: number;
  readonly durationMs: number;
  readonly checkpointReference?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface FeedSynchronizationWarning {
  readonly code: string;
  readonly message: string;
  readonly severity: 'warning' | 'info';
  readonly createdAt: number;
  readonly context?: Record<string, unknown> | undefined;
}

export interface FeedSynchronizationState {
  readonly id: string;
  readonly feedId: string;
  readonly correlationId?: string | undefined;
  readonly currentState: FeedSynchronizationLifecycleState;
  readonly previousState?: FeedSynchronizationLifecycleState | undefined;
  readonly currentVersion: number;
  readonly previousVersion?: number | undefined;
  readonly lastSuccessfulSynchronization?: number | undefined;
  readonly lastAttempt?: number | undefined;
  readonly failureCount: number;
  readonly successCount: number;
  readonly checkpointReference?: string | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly stateTimestamp: number;
  readonly history: readonly FeedStateHistoryEntry[];
  readonly failureHistory: readonly FeedSynchronizationFailureRecord[];
  readonly successHistory: readonly FeedSynchronizationSuccessRecord[];
  readonly warnings: readonly FeedSynchronizationWarning[];
  readonly lastFailure?: FeedSynchronizationFailureRecord | undefined;
}

export interface FeedCheckpoint {
  readonly id: string;
  readonly feedId: string;
  readonly version: number;
  readonly synchronizationVersion: number;
  readonly etag?: string | undefined;
  readonly lastModified?: string | undefined;
  readonly feedHash?: string | undefined;
  readonly episodeCount?: number | undefined;
  readonly lastEpisodeId?: string | undefined;
  readonly lastEpisodePublicationDate?: string | undefined;
  readonly synchronizationCursor?: string | undefined;
  readonly snapshotHash?: string | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: number;
  readonly valid: boolean;
  readonly invalidatedAt?: number | undefined;
  readonly expirationAt?: number | undefined;
  readonly isExpired?: boolean | undefined;
}

export interface FeedSynchronizationSnapshot {
  readonly id: string;
  readonly state: FeedSynchronizationState;
  readonly checkpointReference?: string | undefined;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly statistics: Readonly<Record<string, number | string | boolean | undefined>>;
  readonly warnings: readonly FeedSynchronizationWarning[];
  readonly createdAt: number;
}

export interface FeedSynchronizationProgress {
  readonly state: FeedSynchronizationLifecycleState;
  readonly progressPercent: number;
  readonly hasCheckpoint: boolean;
  readonly checkpointValid: boolean;
  readonly isHealthy: boolean;
  readonly warnings: readonly FeedSynchronizationWarning[];
}

export interface FeedCheckpointComparison {
  readonly identical: boolean;
  readonly feedIdChanged: boolean;
  readonly versionChanged: boolean;
  readonly syncVersionChanged: boolean;
  readonly hashChanged: boolean;
  readonly cursorChanged: boolean;
  readonly episodesChanged: boolean;
  readonly metadataChanges: readonly string[];
}

export interface FeedStateValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}
