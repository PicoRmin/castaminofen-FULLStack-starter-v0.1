import { SynchronizationError, SynchronizationStateError, SynchronizationConflictError } from '../errors';
import type { SynchronizationEventHook, SynchronizationImportService, SynchronizationPersistenceCoordinator, SynchronizationStateStore } from '../interfaces';
import type { SynchronizationLifecycleHooks } from '../events';
import { DefaultSynchronizationStrategyRegistry, type SynchronizationStrategy } from '../strategies';
import type { SynchronizationReport, SynchronizationRequest, SynchronizationResult, SynchronizationStateModel, SynchronizationStatus, SynchronizationWarning, SynchronizationErrorInfo, SynchronizationConflict, SynchronizationStatistics } from '../types';

export interface SynchronizationEngineDependencies {
  readonly importService: SynchronizationImportService;
  readonly stateStore: SynchronizationStateStore;
  readonly persistenceCoordinator?: SynchronizationPersistenceCoordinator;
  readonly hooks?: SynchronizationLifecycleHooks;
  readonly strategies?: readonly SynchronizationStrategy[];
  readonly onEvent?: SynchronizationEventHook;
  readonly defaultStrategyId?: string;
}

export class SynchronizationEngine {
  private readonly strategies: readonly SynchronizationStrategy[];

  public constructor(private readonly dependencies: SynchronizationEngineDependencies) {
    this.strategies = dependencies.strategies ?? DefaultSynchronizationStrategyRegistry.createDefault();
  }

  public async synchronize(request: SynchronizationRequest): Promise<SynchronizationResult> {
    const startedAt = Date.now();
    const warnings: SynchronizationWarning[] = [];
    const errors: SynchronizationErrorInfo[] = [];
    const conflicts: SynchronizationConflict[] = [];
    const stateChanges: string[] = [];
    let status: SynchronizationStatus = 'pending';

    await this.emit('synchronization-started', 'sync', 'Synchronization started', { feedId: request.feedId, feedUrl: request.feedUrl, mode: request.mode });
    const loadedState = await this.dependencies.stateStore.load({ feedId: request.feedId, feedUrl: request.feedUrl, correlationId: request.correlationId ?? undefined });
    const state = this.normalizeState(loadedState, request);

    const selectedStrategy = this.selectStrategy(request, state);
    const strategyDecision = await selectedStrategy.execute(request, state);

    if (request.options?.validateOnly || request.mode === 'validation') {
      status = 'unchanged';
      warnings.push(this.warning('validation-only', 'Validation-only synchronization skipped import work.', 'validation', 'info', 'feed', { feedId: request.feedId }));
      const report = this.composeReport(request, startedAt, Date.now(), warnings, errors, conflicts, state, status, { createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, warningCount: warnings.length, errorCount: errors.length, durationMs: Date.now() - startedAt, createdEntities: 0, updatedEntities: 0, skippedEntities: 0 });
      await this.emit('synchronization-skipped', 'sync', 'Synchronization skipped', { feedId: request.feedId, status });
      return { success: true, status, importResult: undefined, providerMetadata: undefined, statistics: report.statistics, warnings, errors, durationMs: report.durationMs, stateChanges, metadata: { strategy: selectedStrategy.id }, report, conflicts: conflicts ?? undefined };
    }

    if (request.options?.preview || request.mode === 'preview' || request.mode === 'dry-run') {
      status = 'unchanged';
      warnings.push(this.warning('preview-mode', 'Preview mode requested; no persistence will occur.', 'preview', 'info', 'feed', { feedId: request.feedId }));
      const report = this.composeReport(request, startedAt, Date.now(), warnings, errors, conflicts, state, status, { createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, warningCount: warnings.length, errorCount: errors.length, durationMs: Date.now() - startedAt, createdEntities: 0, updatedEntities: 0, skippedEntities: 0 });
      await this.emit('synchronization-skipped', 'sync', 'Synchronization skipped', { feedId: request.feedId, status });
      return { success: true, status, importResult: undefined, providerMetadata: undefined, statistics: report.statistics, warnings, errors, durationMs: report.durationMs, stateChanges, metadata: { strategy: selectedStrategy.id }, report, conflicts: conflicts ?? undefined };
    }

    if (!strategyDecision.shouldSync) {
      status = 'unchanged';
      warnings.push(this.warning('no-change', 'Feed already synchronized and no change was detected.', 'sync', 'warning', 'feed', { feedId: request.feedId }));
      const report = this.composeReport(request, startedAt, Date.now(), warnings, errors, conflicts, state, status, { createdEpisodes: 0, updatedEpisodes: 0, skippedEpisodes: 0, warningCount: warnings.length, errorCount: errors.length, durationMs: Date.now() - startedAt, createdEntities: 0, updatedEntities: 0, skippedEntities: 0 });
      await this.emit('synchronization-completed', 'sync', 'Synchronization completed', { feedId: request.feedId, status });
      return { success: true, status, importResult: undefined, providerMetadata: undefined, statistics: report.statistics, warnings, errors, durationMs: report.durationMs, stateChanges, metadata: { strategy: selectedStrategy.id }, report, conflicts: conflicts ?? undefined };
    }

    try {
      status = 'starting';
      stateChanges.push('starting');
      await this.emit('synchronization-progress', 'sync', 'Synchronization starting', { feedId: request.feedId, state: 'starting' });
      const importResult = await this.dependencies.importService.import({
        feedUrl: request.feedUrl,
        mode: request.mode,
        correlationId: request.correlationId ?? undefined,
        metadata: request.metadata ?? undefined,
        options: request.options as Record<string, unknown>,
      });

      status = importResult.success ? 'completed' : 'failed';
      stateChanges.push(status);
      if (importResult.errors?.length) {
        errors.push(...(importResult.errors as SynchronizationErrorInfo[]));
      }
      if (importResult.warnings?.length) {
        warnings.push(...(importResult.warnings as SynchronizationWarning[]));
      }
      const report = this.composeReport(request, startedAt, Date.now(), warnings, errors, conflicts, state, status, {
        createdEpisodes: Number(importResult.statistics?.createdEpisodes ?? 0),
        updatedEpisodes: Number(importResult.statistics?.updatedEpisodes ?? 0),
        skippedEpisodes: Number(importResult.statistics?.skippedEpisodes ?? 0),
        warningCount: warnings.length,
        errorCount: errors.length,
        durationMs: Date.now() - startedAt,
        createdEntities: Number(importResult.statistics?.createdPodcasts ?? 0) + Number(importResult.statistics?.createdEpisodes ?? 0),
        updatedEntities: Number(importResult.statistics?.updatedPodcasts ?? 0) + Number(importResult.statistics?.updatedEpisodes ?? 0),
        skippedEntities: Number(importResult.statistics?.skippedEpisodes ?? 0),
      });
      await this.emit(importResult.success ? 'synchronization-completed' : 'synchronization-failed', 'sync', importResult.success ? 'Synchronization completed' : 'Synchronization failed', { feedId: request.feedId, status, importResult });
      return {
        success: importResult.success,
        status,
        importResult,
        providerMetadata: (importResult.providerMetadata as Record<string, unknown> | undefined) ?? undefined,
        statistics: report.statistics,
        warnings,
        errors,
        durationMs: report.durationMs,
        stateChanges,
        metadata: { strategy: selectedStrategy.id, fingerprint: strategyDecision.fingerprint ?? undefined },
        report,
        conflicts,
      };
    } catch (error) {
      status = 'failed';
      stateChanges.push('failed');
      const message = error instanceof Error ? error.message : 'Unknown synchronization failure';
      errors.push(this.error('synchronization-failed', message, 'sync', 'feed', { feedId: request.feedId }, 'Retry the synchronization after inspecting the import service output.'));
      await this.emit('synchronization-failed', 'sync', 'Synchronization failed', { feedId: request.feedId, error: message });
      throw new SynchronizationError(message, 'sync-failed', 'sync', request.feedId, { feedId: request.feedId }, 'Retry the synchronization after inspecting the import service output.');
    }
  }

  private normalizeState(loadedState: unknown, request: SynchronizationRequest): SynchronizationStateModel {
    const state = (loadedState as Partial<SynchronizationStateModel> | undefined) ?? {};
    return {
      id: String(state.id ?? request.feedId),
      feedId: String(state.feedId ?? request.feedId),
      state: (state.state as SynchronizationStateModel['state']) ?? 'never-synchronized',
      lastFingerprint: (state.lastFingerprint as string | undefined) ?? undefined,
      lastSyncedAt: (state.lastSyncedAt as number | undefined) ?? undefined,
      metadata: (state.metadata as Record<string, unknown> | undefined) ?? undefined,
      version: Number(state.version ?? 1),
      transitions: Array.isArray(state.transitions) ? state.transitions.filter((value): value is string => typeof value === 'string') : [],
    };
  }

  private selectStrategy(request: SynchronizationRequest, state: SynchronizationStateModel): SynchronizationStrategy {
    const preferred = request.options?.strategy ?? this.dependencies.defaultStrategyId ?? 'incremental';
    const resolved = this.strategies.find((strategy) => strategy.id === preferred) ?? this.strategies[1] ?? this.strategies[0];
    if (!resolved) {
      throw new SynchronizationStrategyError('No synchronization strategy was registered.', 'synchronization-strategy-missing', 'strategy', request.feedId, { requested: preferred });
    }
    if (request.mode === 'full') {
      return this.strategies.find((strategy) => strategy.id === 'full') ?? resolved;
    }
    if (request.mode === 'preview') {
      return this.strategies.find((strategy) => strategy.id === 'preview') ?? resolved;
    }
    if (request.mode === 'validation') {
      return this.strategies.find((strategy) => strategy.id === 'validation') ?? resolved;
    }
    if (request.options?.dryRun) {
      return this.strategies.find((strategy) => strategy.id === 'preview') ?? resolved;
    }
    return resolved;
  }

  private async emit(type: string, stage: string, message: string, context?: Record<string, unknown>): Promise<void> {
    const event = { type, stage, message, context, timestamp: Date.now() };
    const lifecycleEvent = { type, stage, message, context: context ?? undefined };
    await this.dependencies.hooks?.onStarted?.(lifecycleEvent);
    await this.dependencies.hooks?.onProgress?.(lifecycleEvent);
    await this.dependencies.hooks?.onCompleted?.(lifecycleEvent);
    await this.dependencies.hooks?.onFailed?.(lifecycleEvent);
    await this.dependencies.hooks?.onCancelled?.(lifecycleEvent);
    await this.dependencies.hooks?.onSkipped?.(lifecycleEvent);
    await this.dependencies.hooks?.onStateChanged?.(lifecycleEvent);
    await this.dependencies.onEvent?.(event);
  }

  private composeReport(
    request: SynchronizationRequest,
    startedAt: number,
    finishedAt: number,
    warnings: SynchronizationWarning[],
    errors: SynchronizationErrorInfo[],
    conflicts: SynchronizationConflict[],
    state: SynchronizationStateModel,
    status: SynchronizationStatus,
    statistics: SynchronizationStatistics,
  ): SynchronizationReport {
    return {
      startedAt,
      finishedAt,
      durationMs: finishedAt - startedAt,
      feedId: request.feedId,
      feedUrl: request.feedUrl,
      mode: request.mode,
      provider: (request.metadata?.provider as string | undefined) ?? undefined,
      createdEpisodes: statistics.createdEpisodes,
      updatedEpisodes: statistics.updatedEpisodes,
      skippedEpisodes: statistics.skippedEpisodes,
      warnings,
      errors,
      statistics,
    };
  }

  private warning(code: string, message: string, stage: string, severity: 'warning' | 'info', entity: string, context?: Record<string, unknown>): SynchronizationWarning {
    return { code, message, stage, severity, entity, context: context ?? undefined };
  }

  private error(code: string, message: string, stage: string, entity: string, context?: Record<string, unknown>, recovery?: string): SynchronizationErrorInfo {
    return { code, message, stage, entity, context: context ?? undefined, recovery: recovery ?? undefined, syncState: undefined };
  }
}

class SynchronizationStrategyError extends SynchronizationError {
  public constructor(message: string, code: string, stage: string, feedId?: string, context?: Record<string, unknown>) {
    super(message, code, stage, feedId, context);
    this.name = 'SynchronizationStrategyError';
  }
}
