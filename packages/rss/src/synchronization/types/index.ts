export type SynchronizationMode =
  'manual' | 'automatic' | 'incremental' | 'full' | 'validation' | 'preview' | 'dry-run' | 'custom';
export type SynchronizationStatus =
  | 'pending'
  | 'starting'
  | 'downloading'
  | 'importing'
  | 'persisting'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'outdated'
  | 'unchanged';
export type SynchronizationState =
  | 'never-synchronized'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'outdated'
  | 'unchanged';

export * from './feed-state';
export * from './incremental';
export * from './locking';
export * from './recovery';

export interface SynchronizationOptions {
  readonly dryRun?: boolean;
  readonly validateOnly?: boolean;
  readonly preview?: boolean;
  readonly force?: boolean;
  readonly priority?: number;
  readonly metadata?: Record<string, unknown>;
  readonly strategy?: string;
}

export interface SynchronizationRequest {
  readonly feedId: string;
  readonly feedUrl: string;
  readonly mode: SynchronizationMode;
  readonly options?: SynchronizationOptions;
  readonly correlationId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly requestedAt?: Date | string;
  readonly priority?: number;
}

export interface SynchronizationWarning {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly severity: 'warning' | 'info';
  readonly entity: string;
  readonly context: Record<string, unknown> | undefined;
}

export interface SynchronizationConflict {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity: string;
  readonly context: Record<string, unknown> | undefined;
  readonly resolution: string | undefined;
}

export interface SynchronizationErrorInfo {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly entity: string;
  readonly context: Record<string, unknown> | undefined;
  readonly recovery: string | undefined;
  readonly syncState: SynchronizationState | undefined;
}

export interface SynchronizationStatistics {
  readonly createdEpisodes: number;
  readonly updatedEpisodes: number;
  readonly skippedEpisodes: number;
  readonly warningCount: number;
  readonly errorCount: number;
  readonly durationMs: number;
  readonly createdEntities: number;
  readonly updatedEntities: number;
  readonly skippedEntities: number;
}

export interface SynchronizationReport {
  readonly startedAt: number;
  readonly finishedAt: number;
  readonly durationMs: number;
  readonly feedId: string;
  readonly feedUrl: string;
  readonly mode: SynchronizationMode;
  readonly provider: string | undefined;
  readonly createdEpisodes: number;
  readonly updatedEpisodes: number;
  readonly skippedEpisodes: number;
  readonly warnings: readonly SynchronizationWarning[];
  readonly errors: readonly SynchronizationErrorInfo[];
  readonly statistics: SynchronizationStatistics;
}

export interface SynchronizationStateModel {
  readonly id: string;
  readonly feedId: string;
  readonly state: SynchronizationState;
  readonly lastFingerprint: string | undefined;
  readonly lastSyncedAt: number | undefined;
  readonly metadata: Record<string, unknown> | undefined;
  readonly version: number;
  readonly transitions: readonly string[];
}

export interface SynchronizationResult {
  readonly success: boolean;
  readonly status: SynchronizationStatus;
  readonly importResult: Record<string, unknown> | undefined;
  readonly providerMetadata: Record<string, unknown> | undefined;
  readonly statistics: SynchronizationStatistics;
  readonly warnings: readonly SynchronizationWarning[];
  readonly errors: readonly SynchronizationErrorInfo[];
  readonly durationMs: number;
  readonly stateChanges: readonly string[];
  readonly metadata: Record<string, unknown> | undefined;
  readonly report: SynchronizationReport | undefined;
  readonly conflicts: readonly SynchronizationConflict[] | undefined;
}
