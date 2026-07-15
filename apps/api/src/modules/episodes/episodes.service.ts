import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEpisodeDto } from './dto/create-episode.dto';
import { UpdateEpisodeDto } from './dto/update-episode.dto';

@Injectable()
export class EpisodesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEpisodeDto) {
    return this.prisma.episode.create({
      data: {
        podcastId: dto.podcastId,
        title: dto.title,
        slug: dto.slug,
        audioUrl: dto.audioUrl,
        description: dto.description ?? null,
      },
      include: { podcast: true },
    });
  }

  findAll() {
    return this.prisma.episode.findMany({
      include: { podcast: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const episode = await this.prisma.episode.findUnique({
      where: { id },
      include: { podcast: true, bookmarks: true, history: true },
    });
    if (!episode) throw new NotFoundException('Episode not found');
    return episode;
  }

  async update(id: string, dto: UpdateEpisodeDto) {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException('Episode not found');
    return this.prisma.episode.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.audioUrl !== undefined ? { audioUrl: dto.audioUrl } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
      include: { podcast: true },
    });
  }

  async remove(id: string) {
    const episode = await this.prisma.episode.findUnique({ where: { id } });
    if (!episode) throw new NotFoundException('Episode not found');
    await this.prisma.episode.delete({ where: { id } });
    return { deleted: true };
  }
}
