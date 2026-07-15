import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChannelDto, currentUserId: string) {
    return this.prisma.channel.create({
      data: {
        ownerId: dto.ownerId ?? currentUserId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description ?? null,
        isVerified: dto.isVerified ?? false,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  findAll() {
    return this.prisma.channel.findMany({
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { podcasts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true, email: true } }, podcasts: true },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async update(id: string, dto: UpdateChannelDto, currentUserId: string, role: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.ownerId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only update your own channels');
    }

    return this.prisma.channel.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isVerified !== undefined ? { isVerified: dto.isVerified } : {}),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(id: string, currentUserId: string, role: string) {
    const channel = await this.prisma.channel.findUnique({ where: { id } });
    if (!channel) throw new NotFoundException('Channel not found');
    if (channel.ownerId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only delete your own channels');
    }

    await this.prisma.channel.delete({ where: { id } });
    return { deleted: true };
  }
}
