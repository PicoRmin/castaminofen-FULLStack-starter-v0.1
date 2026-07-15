import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFeedDto } from './dto/create-feed.dto';

@Injectable()
export class FeedsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFeedDto, actorId: string) {
    if (!actorId || actorId === 'system') {
      throw new UnauthorizedException('Authentication required');
    }

    const normalizedUrl = dto.url.trim();
    const existing = await this.prisma.podcast.findFirst({
      where: { rssUrl: normalizedUrl },
    });

    if (existing) {
      return this.mapRecord(existing);
    }

    const channel = await this.prisma.channel.findFirst({
      where: { ownerId: actorId },
    });

    const createdChannel = channel ?? (await this.prisma.channel.create({ data: { ownerId: actorId, name: 'Imported Feeds', slug: `imported-feeds-${actorId}` } }));

    const slug = this.toSlug(dto.title ?? new URL(normalizedUrl).hostname);

    const record = await this.prisma.podcast.create({
      data: {
        title: dto.title ?? new URL(normalizedUrl).hostname,
        slug: `${slug}-${Date.now()}`,
        description: `Imported from ${normalizedUrl}`,
        rssUrl: normalizedUrl,
        websiteUrl: dto.websiteUrl ?? normalizedUrl,
        channelId: createdChannel.id,
        status: 'draft',
        syncStatus: 'PENDING',
        isActive: true,
      },
    });

    return this.mapRecord(record);
  }

  async findAll() {
    const items = await this.prisma.podcast.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        rssUrl: true,
        websiteUrl: true,
        syncStatus: true,
        isActive: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      items: items.map((item) => this.mapRecord(item)),
      total: items.length,
    };
  }

  async findOne(id: string) {
    const record = await this.prisma.podcast.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        rssUrl: true,
        websiteUrl: true,
        syncStatus: true,
        isActive: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    return this.mapRecord(record);
  }

  async triggerImport(id: string) {
    const record = await this.prisma.podcast.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    return {
      feedId: record.id,
      imported: true,
      message: 'Import initiated',
    };
  }

  async remove(id: string) {
    const record = await this.prisma.podcast.findUnique({ where: { id } });
    if (!record) {
      throw new NotFoundException('Feed not found');
    }

    await this.prisma.podcast.delete({ where: { id } });

    return { id, deleted: true };
  }

  private mapRecord(record: {
    id: string;
    title: string;
    slug: string;
    rssUrl: string | null;
    websiteUrl: string | null;
    syncStatus: string;
    isActive: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      url: record.rssUrl,
      websiteUrl: record.websiteUrl,
      syncStatus: record.syncStatus,
      isActive: record.isActive,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  private toSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
