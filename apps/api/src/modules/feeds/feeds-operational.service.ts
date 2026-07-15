import { Injectable, NotFoundException } from '@nestjs/common';
import {
  FeedCheckpointManager,
  FeedStateManager,
  SynchronizationRecoveryEngine,
} from '../../../../../packages/rss/src/index';
import { PrismaService } from '../../common/prisma/prisma.service';
import type {
  CheckpointDetailsDto,
  CheckpointSummaryDto,
  FeedStateResponseDto,
  RecoveryResponseDto,
  RestoreCheckpointResponseDto,
  RetryResponseDto,
} from './dto/operational-response.dto';
import type { FeedOperationalRequestDto } from './dto/operational-request.dto';

@Injectable()
export class FeedsOperationalService {
  private readonly feedStateManager: FeedStateManager;
  private readonly checkpointManager: FeedCheckpointManager;
  private readonly recoveryEngine: SynchronizationRecoveryEngine;

  constructor(private readonly prisma: PrismaService) {
    this.feedStateManager = new FeedStateManager();
    this.checkpointManager = new FeedCheckpointManager();
    this.recoveryEngine = new SynchronizationRecoveryEngine();
  }

  async getFeedState(feedId: string): Promise<FeedStateResponseDto> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    const state = this.feedStateManager.createState(feedId, undefined, {
      source: 'api',
      title: record.title,
      lastSyncAt: record.lastSyncAt?.toISOString(),
    });

    return {
      feedId: state.feedId,
      currentState: state.currentState,
      currentVersion: state.currentVersion,
      failureCount: state.failureCount,
      successCount: state.successCount,
      checkpointReference: state.checkpointReference,
      metadata: { ...state.metadata, source: 'api' },
      stateTimestamp: new Date(state.stateTimestamp).toISOString(),
    };
  }

  async getCheckpoints(feedId: string): Promise<CheckpointSummaryDto[]> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    const checkpoint = this.checkpointManager.createCheckpoint(
      this.feedStateManager.createState(feedId, undefined, { source: 'api' }),
      { reason: 'operational-list' },
    );

    return [
      {
        id: checkpoint.id,
        feedId: checkpoint.feedId,
        version: checkpoint.version,
        valid: checkpoint.valid,
        createdAt: new Date(checkpoint.createdAt).toISOString(),
      },
    ];
  }

  async getCheckpoint(feedId: string, checkpointId: string): Promise<CheckpointDetailsDto> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    let checkpoint;
    try {
      checkpoint = this.checkpointManager.restoreCheckpoint(feedId, checkpointId);
    } catch (error) {
      const maybeCode =
        error instanceof Error && 'errorCode' in error
          ? (error as Error & { errorCode?: string }).errorCode
          : undefined;
      if (maybeCode === 'checkpoint-not-found') {
        throw new NotFoundException('Checkpoint not found');
      }
      throw error;
    }

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return {
      id: checkpoint.id,
      feedId: checkpoint.feedId,
      version: checkpoint.version,
      valid: checkpoint.valid,
      createdAt: new Date(checkpoint.createdAt).toISOString(),
      etag: checkpoint.etag,
      feedHash: checkpoint.feedHash,
      episodeCount: checkpoint.episodeCount,
      synchronizationCursor: checkpoint.synchronizationCursor,
      metadata: { ...checkpoint.metadata },
    };
  }

  async requestRetry(feedId: string, dto?: FeedOperationalRequestDto): Promise<RetryResponseDto> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    const state = this.feedStateManager.createState(feedId, dto?.options?.correlationId, {
      source: 'api',
      requestedBy: dto?.options?.requestedBy,
      reason: dto?.options?.reason,
    });

    const plan = await this.recoveryEngine.evaluateFailure({
      feedId,
      failure: 'retry-evaluation-requested',
      attempt: 1,
      maxRetries: 3,
      state,
      metadata: {
        source: 'api',
        ...(dto?.options?.metadata ?? {}),
        reason: dto?.options?.reason,
        correlationId: dto?.options?.correlationId,
      },
    });

    return {
      feedId,
      status: 'accepted',
      accepted: true,
      message:
        plan.recoveryAction === 'permanent-failure'
          ? 'Retry evaluation requested'
          : 'Retry evaluation requested',
      correlationId: dto?.options?.correlationId,
    };
  }

  async requestRecovery(
    feedId: string,
    dto?: FeedOperationalRequestDto,
  ): Promise<RecoveryResponseDto> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    const state = this.feedStateManager.createState(feedId, dto?.options?.correlationId, {
      source: 'api',
      requestedBy: dto?.options?.requestedBy,
      reason: dto?.options?.reason,
    });

    const plan = await this.recoveryEngine.evaluateFailure({
      feedId,
      failure: 'recovery-evaluation-requested',
      attempt: 1,
      maxRetries: 3,
      state,
      metadata: {
        source: 'api',
        ...(dto?.options?.metadata ?? {}),
        reason: dto?.options?.reason,
        correlationId: dto?.options?.correlationId,
      },
    });

    return {
      feedId,
      status: 'accepted',
      accepted: true,
      message:
        plan.recoveryAction === 'permanent-failure'
          ? 'Recovery evaluation requested'
          : 'Recovery evaluation requested',
      correlationId: dto?.options?.correlationId,
    };
  }

  async restoreCheckpoint(
    feedId: string,
    checkpointId: string,
    dto?: FeedOperationalRequestDto,
  ): Promise<RestoreCheckpointResponseDto> {
    const record = await this.prisma.podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    let checkpoint;
    try {
      checkpoint = this.checkpointManager.restoreCheckpoint(feedId, checkpointId);
    } catch (error) {
      const maybeCode =
        error instanceof Error && 'errorCode' in error
          ? (error as Error & { errorCode?: string }).errorCode
          : undefined;
      if (maybeCode === 'checkpoint-not-found') {
        throw new NotFoundException('Checkpoint not found');
      }
      throw error;
    }

    if (!checkpoint) {
      throw new NotFoundException('Checkpoint not found');
    }

    return {
      feedId,
      checkpointId,
      status: 'accepted',
      accepted: true,
      message: 'Restore request accepted',
      correlationId: dto?.options?.correlationId,
    };
  }
}
