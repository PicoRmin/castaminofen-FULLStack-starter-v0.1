import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePlaylistDto, currentUserId: string, role: string) {
    if (dto.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only create playlists for yourself');
    }

    return this.prisma.playlist.create({ data: { userId: dto.userId, name: dto.name } });
  }

  findByUser(userId: string) {
    return this.prisma.playlist.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, dto: UpdatePlaylistDto, currentUserId: string, role: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only update your own playlists');
    }

    return this.prisma.playlist.update({
      where: { id },
      data: { ...(dto.name ? { name: dto.name } : {}) },
    });
  }

  async remove(id: string, currentUserId: string, role: string) {
    const playlist = await this.prisma.playlist.findUnique({ where: { id } });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only delete your own playlists');
    }

    await this.prisma.playlist.delete({ where: { id } });
    return { deleted: true };
  }
}
