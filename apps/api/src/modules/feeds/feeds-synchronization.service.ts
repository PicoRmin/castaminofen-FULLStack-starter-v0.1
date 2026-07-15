import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { SynchronizationRequest, SynchronizationResult } from '@castaminofen/rss';
import { SynchronizationEngine, FeedLockManager, FeedConcurrencyController, FeedLeaseManager, FeedStateManager, SynchronizationTelemetry } from '@castaminofen/rss';
import type { SyncFeedRequestDto } from './dto/sync-feed.dto';

@Injectable()
export class FeedsSynchronizationService {
  private readonly synchronizationEngine: SynchronizationEngine;
  private readonly lockManager: FeedLockManager;
  private readonly leaseManager: FeedLeaseManager;
  private readonly concurrencyController: FeedConcurrencyController;
  private readonly telemetry: SynchronizationTelemetry;

  constructor(private readonly prisma: PrismaService) {
    this.lockManager = new FeedLockManager();
    this.leaseManager = new FeedLeaseManager();
    this.concurrencyController = new FeedConcurrencyController({
      lockManager: this.lockManager,
      leaseManager: this.leaseManager,
    });
    this.telemetry = new SynchronizationTelemetry();
    this.synchronizationEngine = new SynchronizationEngine({
      importService: {
        async import(request) {
          return {
            success: true,
            statistics: {
              createdEpisodes: 0,
              updatedEpisodes: 0,
              skippedEpisodes: 0,
              createdPodcasts: 0,
              updatedPodcasts: 0,
            },
            providerMetadata: { source: 'api-trigger' },
            mode: request.mode,
            correlationId: request.correlationId,
            metadata: request.metadata,
          };
        },
      },
      stateStore: {
        load: async () => undefined,
        save: async () => undefined,
      },
      hooks: {
        onStarted: async (event) => this.telemetry.emitEvent('synchronization-requested', { event: event.type, feedId: event.context?.feedId }),
        onProgress: async (event) => this.telemetry.emitEvent('synchronization-accepted', { event: event.type, feedId: event.context?.feedId }),
        onFailed: async (event) => this.telemetry.emitEvent('synchronization-rejected', { event: event.type, feedId: event.context?.feedId }),
        onCompleted: async (event) => this.telemetry.emitEvent('synchronization-completed', { event: event.type, feedId: event.context?.feedId }),
      },
      onEvent: async (event) => {
        this.telemetry.emitEvent(event.type, event.context ?? {});
      },
    });
  }

  async triggerSingleFeedSync(id: string, dto?: SyncFeedRequestDto, actorId?: string): Promise<SynchronizationResult> {
    const record = await this.prisma.podcast.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    const correlationId = dto?.options?.correlationId ?? `feed-sync:${record.id}:${Date.now()}`;
    const request: SynchronizationRequest = {
      feedId: record.id,
      feedUrl: record.rssUrl ?? record.websiteUrl ?? '',
      mode: dto?.options?.mode ?? 'incremental',
      options: {
        dryRun: dto?.options?.dryRun ?? false,
        validateOnly: dto?.options?.validateOnly ?? false,
        preview: dto?.options?.preview ?? false,
        force: dto?.options?.force ?? false,
        priority: dto?.options?.priority,
        metadata: {
          ...(dto?.options?.metadata ?? {}),
          actorId,
          reason: dto?.options?.reason,
          correlationId,
        },
      },
      correlationId,
      metadata: {
        actorId,
        reason: dto?.options?.reason,
        correlationId,
        source: 'api',
      },
      priority: dto?.options?.priority,
    };

    const lock = await this.lockManager.acquireLock({
      feedId: request.feedId,
      ownerId: actorId ?? 'api-trigger',
      correlationId,
      policy: { strategy: 'single-feed', ttlMs: 60_000, allowSteal: false },
      metadata: { source: 'api' },
    });

    const decision = await this.concurrencyController.authorizeExecution({
      lock,
      feedId: request.feedId,
      ownerId: actorId ?? 'api-trigger',
      correlationId,
      strategyId: 'single-feed',
    });

    if (!decision.allowed) {
      return {
        success: false,
        status: 'failed',
        importResult: undefined,
        providerMetadata: undefined,
        statistics: {
          createdEpisodes: 0,
          updatedEpisodes: 0,
          skippedEpisodes: 0,
          warningCount: 0,
          errorCount: 1,
          durationMs: 0,
          createdEntities: 0,
          updatedEntities: 0,
          skippedEntities: 0,
        },
        warnings: [],
        errors: [
          {
            code: decision.conflict?.code ?? 'lock-unauthorized',
            message: decision.conflict?.message ?? 'Synchronization request rejected by the locking policy.',
            stage: decision.stage,
            entity: 'feed',
            context: { feedId: request.feedId },
            recovery: decision.conflict?.resolution,
            syncState: undefined,
          },
        ],
        durationMs: 0,
        stateChanges: [],
        metadata: { correlationId },
        report: undefined,
        conflicts: undefined,
      };
    }

    const result = await this.synchronizationEngine.synchronize(request);
    await this.lockManager.releaseLock(lock, { ownerId: actorId ?? 'api-trigger', correlationId });
    return result;
  }

  async triggerAllFeedsSync(dto?: SyncFeedRequestDto, actorId?: string): Promise<{ accepted: boolean; status: string; message: string; feedCount: number }> {
    const feeds = await this.prisma.podcast.findMany({ select: { id: true } });
    const correlationId = dto?.options?.correlationId ?? `feed-sync-all:${Date.now()}`;

    for (const feed of feeds) {
      await this.triggerSingleFeedSync(feed.id, dto, actorId);
    }

    return {
      accepted: true,
      status: 'accepted',
      message: 'Synchronization request accepted for all feeds',
      feedCount: feeds.length,
    };

  }
}
