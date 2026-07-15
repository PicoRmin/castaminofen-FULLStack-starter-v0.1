import type { FeedCheckpoint, FeedSynchronizationState } from '../types';
import type { FeedCheckpointManagerLike, FeedStateManagerLike } from '../interfaces';
import { ComparisonEngine } from '../comparison';
import { DiffEngine } from '../diff';
import { FeedCheckpointManager } from '../checkpoints/feed-checkpoint-manager';
import { FeedStateManager } from '../state/feed-state-manager';
import type { SynchronizationLifecycleHooks } from '../events';
import type {
  SynchronizationImportService,
  SynchronizationPersistenceCoordinator,
} from '../interfaces';
import type {
  ComparisonContext,
  ComparisonResult,
  SynchronizationErrorInfo,
  SynchronizationWarning,
  SynchronizationResult,
  SynchronizationReport,
  SynchronizationRequest,
  SynchronizationStatistics,
  SynchronizationStatus,
} from '../types';
import {
  CheckpointMismatchError,
  DifferenceEngineError,
  SynchronizationSnapshotError,
} from '../errors/incremental';

export interface IncrementalSynchronizationEngineDependencies {
  readonly feedStateManager?: FeedStateManagerLike;
  readonly checkpointManager?: FeedCheckpointManagerLike;
  readonly state?: FeedSynchronizationState;
  readonly importService?: SynchronizationImportService;
  readonly persistenceCoordinator?: SynchronizationPersistenceCoordinator;
  readonly downloader?: {
    download(
      url: string,
      headers?: Record<string, string>,
    ): Promise<{
      ok: boolean;
      response?: {
        status: number;
        headers?: Record<string, string | undefined>;
        body?: string;
        etag?: string;
        lastModified?: string;
        requestId?: string;
      };
    }>;
  };
  readonly comparisonEngine?: {
    compare(context: ComparisonContext): Promise<ComparisonResult>;
  };
  readonly hooks?: SynchronizationLifecycleHooks;
  readonly strategy?: string;
}

export interface IncrementalSynchronizationContext {
  readonly request: SynchronizationRequest;
  readonly state: FeedSynchronizationState;
  readonly checkpoint?: FeedCheckpoint;
}

export class IncrementalSynchronizationEngine {
  private readonly feedStateManager: FeedStateManagerLike;
  private readonly checkpointManager: FeedCheckpointManagerLike;
  private readonly comparisonEngine: IncrementalSynchronizationEngineDependencies['comparisonEngine'] | undefined;
  private readonly importService: SynchronizationImportService | undefined;
  private readonly persistenceCoordinator: SynchronizationPersistenceCoordinator | undefined;
  private readonly downloader: IncrementalSynchronizationEngineDependencies['downloader'] | undefined;
  private readonly hooks: SynchronizationLifecycleHooks | undefined;
  private readonly diffEngine = new DiffEngine();

  public constructor(
    private readonly dependencies: IncrementalSynchronizationEngineDependencies = {},
  ) {
    this.feedStateManager = dependencies.feedStateManager ?? new FeedStateManager();
    this.checkpointManager = dependencies.checkpointManager ?? new FeedCheckpointManager();
    this.comparisonEngine = dependencies.comparisonEngine ?? new ComparisonEngine();
    this.importService = dependencies.importService;
    this.persistenceCoordinator = dependencies.persistenceCoordinator;
    this.downloader = dependencies.downloader;
    this.hooks = dependencies.hooks;
  }

  public async synchronize(request: SynchronizationRequest): Promise<SynchronizationResult> {
    const startedAt = Date.now();
    const warnings: SynchronizationWarning[] = [];
    const errors: SynchronizationErrorInfo[] = [];
    const state =
      this.dependencies.state ??
      (await this.feedStateManager.createState(
        request.feedId,
        request.correlationId,
        request.metadata,
      ));
    const checkpoint = this.resolveCheckpoint(state, request);
    await this.emit(
      'incremental-sync-started',
      'incremental-sync',
      'Incremental synchronization started',
      { feedId: request.feedId, checkpointId: checkpoint?.id },
    );
    const previousSnapshot = this.toSnapshot(state, checkpoint);

    if (checkpoint && !this.isCheckpointCompatible(checkpoint, state)) {
      throw new CheckpointMismatchError('Checkpoint does not match the current feed state.', {
        feedId: request.feedId,
        checkpointId: checkpoint.id,
        context: { stateVersion: state.currentVersion, checkpointVersion: checkpoint.version },
      });
    }
    const conditionalResponse = await this.tryConditionalDownload(request, checkpoint);
    if (conditionalResponse.notModified) {
      const report = this.composeReport(
        request,
        startedAt,
        Date.now(),
        warnings,
        errors,
        {
          createdEpisodes: 0,
          updatedEpisodes: 0,
          skippedEpisodes: 0,
          warningCount: 0,
          errorCount: 0,
          durationMs: Date.now() - startedAt,
          createdEntities: 0,
          updatedEntities: 0,
          skippedEntities: 0,
        },
        'unchanged',
      );
      warnings.push(
        this.warning(
          'no-change',
          'The feed was unchanged according to the conditional response.',
          'incremental-sync',
          'warning',
          'feed',
          { feedId: request.feedId },
        ),
      );
      await this.emit(
        'synchronization-completed',
        'incremental-sync',
        'Synchronization completed',
        { feedId: request.feedId, status: 'unchanged' },
      );
      return {
        success: true,
        status: 'unchanged',
        importResult: undefined,
        providerMetadata: undefined,
        statistics: report.statistics,
        warnings,
        errors,
        durationMs: report.durationMs,
        stateChanges: ['unchanged'],
        metadata: { checkpointId: checkpoint?.id },
        report,
        conflicts: [],
      };
    }

    const comparisonResult = (await this.comparisonEngine?.compare({
      request: {
        feedId: request.feedId,
        feedUrl: request.feedUrl,
        ...(request.correlationId !== undefined ? { correlationId: request.correlationId } : {}),
        ...(request.metadata !== undefined ? { metadata: request.metadata } : {}),
      },
      previousSnapshot,
      currentSnapshot: conditionalResponse.snapshot ?? this.toSnapshot(state, checkpoint),
      ...(checkpoint
        ? {
            previousCheckpoint: {
              ...(checkpoint.id !== undefined ? { id: checkpoint.id } : {}),
              ...(checkpoint.etag !== undefined ? { etag: checkpoint.etag } : {}),
              ...(checkpoint.lastModified !== undefined ? { lastModified: checkpoint.lastModified } : {}),
              ...(checkpoint.feedHash !== undefined ? { feedHash: checkpoint.feedHash } : {}),
              ...(checkpoint.snapshotHash !== undefined ? { snapshotHash: checkpoint.snapshotHash } : {}),
              ...(checkpoint.episodeCount !== undefined ? { episodeCount: checkpoint.episodeCount } : {}),
              ...(checkpoint.metadata !== undefined ? { metadata: checkpoint.metadata } : {}),
              ...(checkpoint.version !== undefined ? { version: checkpoint.version } : {}),
            },
            currentCheckpoint: {
              ...(checkpoint.id !== undefined ? { id: checkpoint.id } : {}),
              ...(checkpoint.etag !== undefined ? { etag: checkpoint.etag } : {}),
              ...(checkpoint.lastModified !== undefined ? { lastModified: checkpoint.lastModified } : {}),
              ...(checkpoint.feedHash !== undefined ? { feedHash: checkpoint.feedHash } : {}),
              ...(checkpoint.snapshotHash !== undefined ? { snapshotHash: checkpoint.snapshotHash } : {}),
              ...(checkpoint.episodeCount !== undefined ? { episodeCount: checkpoint.episodeCount } : {}),
              ...(checkpoint.metadata !== undefined ? { metadata: checkpoint.metadata } : {}),
              ...(checkpoint.version !== undefined ? { version: checkpoint.version } : {}),
            },
          }
        : {}),
      state,
    })) ?? { differences: [], warnings: [], errors: [], hasChanges: false, summary: {} };
    if (comparisonResult.errors.length > 0) {
      errors.push(...(comparisonResult.errors as unknown as SynchronizationErrorInfo[]));
    }
    warnings.push(...(comparisonResult.warnings as unknown as SynchronizationWarning[]));

    const importPlan = this.diffEngine.createImportPlan(
      comparisonResult.differences as readonly any[],
      previousSnapshot,
      conditionalResponse.snapshot ?? previousSnapshot,
    );
    if (importPlan.operations.length === 0) {
      const report = this.composeReport(
        request,
        startedAt,
        Date.now(),
        warnings,
        errors,
        {
          createdEpisodes: 0,
          updatedEpisodes: 0,
          skippedEpisodes: 0,
          warningCount: warnings.length,
          errorCount: errors.length,
          durationMs: Date.now() - startedAt,
          createdEntities: 0,
          updatedEntities: 0,
          skippedEntities: 0,
        },
        'unchanged',
      );
      warnings.push(
        this.warning(
          'no-change',
          'No import operations were needed for the current feed state.',
          'incremental-sync',
          'warning',
          'feed',
          { feedId: request.feedId },
        ),
      );
      return {
        success: true,
        status: 'unchanged',
        importResult: undefined,
        providerMetadata: undefined,
        statistics: report.statistics,
        warnings,
        errors,
        durationMs: report.durationMs,
        stateChanges: ['unchanged'],
        metadata: { checkpointId: checkpoint?.id, operations: importPlan.operations },
        report,
        conflicts: [],
      };
    }

    if (!this.importService) {
      return {
        success: true,
        status: 'completed',
        importResult: { plan: importPlan },
        providerMetadata: undefined,
        statistics: this.emptyStatistics(startedAt),
        warnings,
        errors,
        durationMs: Date.now() - startedAt,
        stateChanges: ['completed'],
        metadata: { checkpointId: checkpoint?.id, operations: importPlan.operations },
        report: undefined,
        conflicts: [],
      };
    }

    const importResult = await this.importService.import({
      feedUrl: request.feedUrl,
      mode: request.mode,
      correlationId: request.correlationId,
      metadata: { ...(request.metadata ?? {}), importPlan },
      options: { skipPersistence: true },
    });
    if (this.persistenceCoordinator && importResult.success) {
      await this.persistenceCoordinator.execute({
        plan: importPlan,
        correlationId: request.correlationId,
        metadata: { importPlan, feedId: request.feedId },
        executionOrder: ['feed', 'episode', 'metadata'],
      });
    }
    const report = this.composeReport(
      request,
      startedAt,
      Date.now(),
      warnings,
      errors,
      {
        createdEpisodes: Number(importResult.statistics?.createdEpisodes ?? 0),
        updatedEpisodes: Number(importResult.statistics?.updatedEpisodes ?? 0),
        skippedEpisodes: Number(importResult.statistics?.skippedEpisodes ?? 0),
        warningCount: warnings.length,
        errorCount: errors.length,
        durationMs: Date.now() - startedAt,
        createdEntities:
          Number(importResult.statistics?.createdPodcasts ?? 0) +
          Number(importResult.statistics?.createdEpisodes ?? 0),
        updatedEntities:
          Number(importResult.statistics?.updatedPodcasts ?? 0) +
          Number(importResult.statistics?.updatedEpisodes ?? 0),
        skippedEntities: Number(importResult.statistics?.skippedEpisodes ?? 0),
      },
      'completed',
    );
    await this.emit('synchronization-completed', 'incremental-sync', 'Synchronization completed', {
      feedId: request.feedId,
      status: 'completed',
      importResult,
    });
    return {
      success: true,
      status: 'completed',
      importResult,
      providerMetadata: undefined,
      statistics: report.statistics,
      warnings,
      errors,
      durationMs: report.durationMs,
      stateChanges: ['completed'],
      metadata: { checkpointId: checkpoint?.id, operations: importPlan.operations },
      report,
      conflicts: [],
    };
  }

  private resolveCheckpoint(
    state: FeedSynchronizationState,
    request: SynchronizationRequest,
  ): FeedCheckpoint | undefined {
    const checkpointId =
      (request.metadata?.checkpointId as string | undefined) ?? state.checkpointReference;
    if (!checkpointId) {
      return undefined;
    }
    return this.checkpointManager.restoreCheckpoint(request.feedId, checkpointId);
  }

  private isCheckpointCompatible(
    checkpoint: FeedCheckpoint,
    state: FeedSynchronizationState,
  ): boolean {
    return checkpoint.feedId === state.feedId && checkpoint.version === state.currentVersion;
  }

  private async tryConditionalDownload(
    request: SynchronizationRequest,
    checkpoint?: FeedCheckpoint,
  ): Promise<{
    notModified: boolean;
    snapshot?: {
      id: string;
      feedId: string;
      etag?: string;
      lastModified?: string;
      feedHash?: string;
      snapshotHash?: string;
      episodeCount?: number;
      metadata?: Record<string, unknown>;
      body?: string;
      content?: string;
      timestamp?: number;
      version?: number;
      guid?: string;
    };
  }> {
    if (!this.downloader) {
      return { notModified: false };
    }
    const headers: Record<string, string> = {};
    if (checkpoint?.etag) headers['If-None-Match'] = checkpoint.etag;
    if (checkpoint?.lastModified) headers['If-Modified-Since'] = checkpoint.lastModified;
    const result = await this.downloader.download(request.feedUrl, headers);
    if (!result.ok) {
      throw new DifferenceEngineError('Conditional download failed.', {
        feedId: request.feedId,
        context: { response: result },
      });
    }
    const status = result.response?.status ?? 200;
    const notModified = status === 304;
    return {
      notModified,
      ...(notModified
        ? {}
        : {
            snapshot: {
              id: `snapshot:${request.feedId}:${Date.now()}`,
              feedId: request.feedId,
              ...(result.response?.etag ? { etag: result.response.etag } : {}),
              ...(result.response?.lastModified ? { lastModified: result.response.lastModified } : {}),
              metadata: { body: result.response?.body },
              ...(result.response?.body ? { body: result.response.body } : {}),
              ...(result.response?.body ? { content: result.response.body } : {}),
              timestamp: Date.now(),
              version: 1,
            },
          }),
    };
  }

  private toSnapshot(
    state: FeedSynchronizationState,
    checkpoint?: FeedCheckpoint,
  ): {
    id: string;
    feedId: string;
    etag?: string;
    lastModified?: string;
    feedHash?: string;
    snapshotHash?: string;
    episodeCount?: number;
    metadata?: Record<string, unknown>;
    body?: string;
    content?: string;
    timestamp?: number;
    version?: number;
    guid?: string;
  } {
    const etag = (checkpoint?.etag ?? state.metadata.etag) as string | undefined;
    const lastModified = (checkpoint?.lastModified ?? state.metadata.lastModified) as string | undefined;
    const feedHash = (checkpoint?.feedHash ?? state.metadata.feedHash) as string | undefined;
    const snapshotHash = (checkpoint?.snapshotHash ?? state.metadata.snapshotHash) as string | undefined;
    const episodeCount = checkpoint?.episodeCount ?? (state.metadata.episodeCount as number | undefined);
    const guid = state.metadata.guid as string | undefined;
    return {
      id: `snapshot:${state.feedId}:${state.currentVersion}`,
      feedId: state.feedId,
      ...(etag ? { etag } : {}),
      ...(lastModified ? { lastModified } : {}),
      ...(feedHash ? { feedHash } : {}),
      ...(snapshotHash ? { snapshotHash } : {}),
      ...(episodeCount !== undefined ? { episodeCount } : {}),
      metadata: { ...(state.metadata as Record<string, unknown> | undefined) },
      version: state.currentVersion,
      timestamp: state.stateTimestamp,
      ...(guid ? { guid } : {}),
    };
  }

  private composeReport(
    request: SynchronizationRequest,
    startedAt: number,
    finishedAt: number,
    warnings: SynchronizationWarning[],
    errors: SynchronizationErrorInfo[],
    statistics: SynchronizationStatistics,
    status: SynchronizationStatus,
  ): SynchronizationReport {
    return {
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      feedId: request.feedId,
      feedUrl: request.feedUrl,
      mode: request.mode,
      provider: request.metadata?.provider as string | undefined,
      createdEpisodes: statistics.createdEpisodes,
      updatedEpisodes: statistics.updatedEpisodes,
      skippedEpisodes: statistics.skippedEpisodes,
      warnings,
      errors,
      statistics,
    };
  }

  private warning(
    code: string,
    message: string,
    stage: string,
    severity: 'warning' | 'info',
    entity: string,
    context?: Record<string, unknown>,
  ): SynchronizationWarning {
    return { code, message, stage, severity, entity, context: context ?? undefined };
  }

  private emptyStatistics(startedAt: number): SynchronizationStatistics {
    return {
      createdEpisodes: 0,
      updatedEpisodes: 0,
      skippedEpisodes: 0,
      warningCount: 0,
      errorCount: 0,
      durationMs: Date.now() - startedAt,
      createdEntities: 0,
      updatedEntities: 0,
      skippedEntities: 0,
    };
  }

  private async emit(
    type: string,
    stage: string,
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const event = { type, stage, message, context: context ?? undefined };
    await this.hooks?.onStarted?.(event);
    await this.hooks?.onProgress?.(event);
    await this.hooks?.onCompleted?.(event);
    await this.hooks?.onFailed?.(event);
    await this.hooks?.onCancelled?.(event);
    await this.hooks?.onSkipped?.(event);
    await this.hooks?.onStateChanged?.(event);
  }
}

export { ComparisonEngine, DiffEngine };
