import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { UpdateFeedDto } from './dto/administration-request.dto';
import type { UpdateConfigurationDto } from './dto/administration-request.dto';

export interface FeedAdministrationState {
  displayName?: string | null;
  description?: string | null;
  category?: string | null;
  tags?: string[];
  language?: string | null;
  visibility?: string | null;
  customSettings?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
}

export interface FeedConfigurationSnapshot {
  syncEnabled: boolean;
  importEnabled: boolean;
  healthEvaluationEnabled: boolean;
  retryPolicy: string;
  recoveryPolicy: string;
  priority: number;
  retentionPolicy: string;
  schedulingPolicy: string;
  providerOverrides: Record<string, unknown>;
  metadataPolicy: Record<string, unknown>;
}

@Injectable()
export class FeedsAdministrationService {
  private readonly stateStore = new Map<string, FeedAdministrationState>();
  private readonly configurationStore = new Map<string, FeedConfigurationSnapshot>();

  constructor(private readonly prisma: PrismaService) {}

  async updateFeed(feedId: string, dto: UpdateFeedDto) {
    const record = await this.findFeedOrThrow(feedId);

    const nextState = this.normalizeState(dto);
    const data: Record<string, unknown> = {};

    if (dto.displayName !== undefined) {
      data.title = dto.displayName;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.language !== undefined) {
      data.language = dto.language;
    }

    const updated = Object.keys(data).length > 0
      ? await (this.prisma as any).podcast.update({
          where: { id: feedId },
          data,
        })
      : record;

    const state = this.mergeState(record, nextState);
    this.stateStore.set(feedId, state);

    return {
      feedId: updated.id,
      status: 'updated',
      message: 'Feed metadata updated',
      metadata: {
        displayName: updated.title,
        description: updated.description ?? null,
        category: state.category ?? null,
        tags: state.tags ?? [],
        language: updated.language ?? null,
        visibility: state.visibility ?? 'private',
        customSettings: state.customSettings ?? {},
      },
    };
  }

  async enableFeed(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);

    if (record.isActive) {
      return {
        feedId: record.id,
        status: 'already-enabled',
        message: 'Feed is already enabled',
        enabled: true,
      };
    }

    const updated = await (this.prisma as any).podcast.update({
      where: { id: feedId },
      data: { isActive: true },
    });

    return {
      feedId: updated.id,
      status: 'enabled',
      message: 'Feed enabled',
      enabled: true,
    };
  }

  async disableFeed(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);

    if (!record.isActive) {
      return {
        feedId: record.id,
        status: 'already-disabled',
        message: 'Feed is already disabled',
        enabled: false,
      };
    }

    const updated = await (this.prisma as any).podcast.update({
      where: { id: feedId },
      data: { isActive: false },
    });

    return {
      feedId: updated.id,
      status: 'disabled',
      message: 'Feed disabled',
      enabled: false,
    };
  }

  async archiveFeed(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);

    if (record.status === 'archived') {
      return {
        feedId: record.id,
        status: 'already-archived',
        message: 'Feed is already archived',
        archived: true,
      };
    }

    const updated = await (this.prisma as any).podcast.update({
      where: { id: feedId },
      data: { status: 'archived' },
    });

    return {
      feedId: updated.id,
      status: 'archived',
      message: 'Feed archived',
      archived: true,
    };
  }

  async unarchiveFeed(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);

    if (record.status !== 'archived') {
      return {
        feedId: record.id,
        status: 'not-archived',
        message: 'Feed is not archived',
        archived: false,
      };
    }

    const updated = await (this.prisma as any).podcast.update({
      where: { id: feedId },
      data: { status: 'draft' },
    });

    return {
      feedId: updated.id,
      status: 'unarchived',
      message: 'Feed unarchived',
      archived: false,
    };
  }

  async resetFeed(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);

    const updated = await (this.prisma as any).podcast.update({
      where: { id: feedId },
      data: {
        status: 'draft',
        syncStatus: 'PENDING',
        isActive: true,
      },
    });

    this.stateStore.delete(feedId);
    this.configurationStore.delete(feedId);

    return {
      feedId: updated.id,
      status: 'reset',
      message: 'Feed administrative state reset',
      reset: true,
    };
  }

  async revalidateFeed(feedId: string) {
    await this.findFeedOrThrow(feedId);

    return {
      feedId,
      status: 'revalidated',
      message: 'Validation pipeline requested',
      revalidated: true,
    };
  }

  async getConfiguration(feedId: string) {
    const record = await this.findFeedOrThrow(feedId);
    const configuration = this.buildConfiguration(record, feedId);

    return {
      feedId: record.id,
      configuration,
      updatedAt: new Date().toISOString(),
    };
  }

  async updateConfiguration(feedId: string, dto: UpdateConfigurationDto) {
    const record = await this.findFeedOrThrow(feedId);
    const existing = this.buildConfiguration(record, feedId);
    const nextConfiguration = {
      ...existing,
      ...(dto.configuration ?? {}),
    };

    if (dto.configuration?.syncEnabled !== undefined) {
      await (this.prisma as any).podcast.update({
        where: { id: feedId },
        data: { isActive: dto.configuration.syncEnabled },
      });
    }

    if (dto.configuration?.importEnabled !== undefined) {
      await (this.prisma as any).podcast.update({
        where: { id: feedId },
        data: { isActive: dto.configuration.importEnabled },
      });
    }

    this.configurationStore.set(feedId, nextConfiguration);

    return {
      feedId: record.id,
      status: 'updated',
      message: 'Feed configuration updated',
      configuration: nextConfiguration,
    };
  }

  private async findFeedOrThrow(feedId: string) {
    const record = await (this.prisma as any).podcast.findUnique({ where: { id: feedId } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }
    return record;
  }

  private normalizeState(dto: UpdateFeedDto): FeedAdministrationState {
    return {
      ...(dto.displayName !== undefined ? { displayName: dto.displayName ?? null } : {}),
      ...(dto.description !== undefined ? { description: dto.description ?? null } : {}),
      ...(dto.category !== undefined ? { category: dto.category ?? null } : {}),
      ...(dto.tags !== undefined ? { tags: dto.tags ?? [] } : {}),
      ...(dto.language !== undefined ? { language: dto.language ?? null } : {}),
      ...(dto.visibility !== undefined ? { visibility: dto.visibility ?? null } : {}),
      ...(dto.customSettings !== undefined ? { customSettings: dto.customSettings ?? {} } : {}),
    };
  }

  private mergeState(record: { title: string; description: string | null; language: string | null }, nextState: FeedAdministrationState): FeedAdministrationState {
    const existing = this.stateStore.get(record.title) ?? {};
    return {
      ...existing,
      displayName: nextState.displayName ?? existing.displayName ?? record.title,
      description: nextState.description ?? existing.description ?? null,
      category: nextState.category ?? existing.category ?? null,
      tags: nextState.tags ?? existing.tags ?? [],
      language: nextState.language ?? existing.language ?? record.language,
      visibility: nextState.visibility ?? existing.visibility ?? 'private',
      customSettings: nextState.customSettings ?? existing.customSettings ?? {},
    };
  }

  private buildConfiguration(record: { isActive: boolean; status: string }, feedId: string): FeedConfigurationSnapshot {
    const stored = this.configurationStore.get(feedId);
    const base: FeedConfigurationSnapshot = {
      syncEnabled: record.isActive,
      importEnabled: record.isActive,
      healthEvaluationEnabled: record.status !== 'archived',
      retryPolicy: 'fixed-delay',
      recoveryPolicy: 'none',
      priority: 5,
      retentionPolicy: 'default',
      schedulingPolicy: 'default',
      providerOverrides: {},
      metadataPolicy: {
        visibility: record.isActive ? 'public' : 'private',
      },
    };

    return stored ? { ...base, ...stored } : base;
  }
}
