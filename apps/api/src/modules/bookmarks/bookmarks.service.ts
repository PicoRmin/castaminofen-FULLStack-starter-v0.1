import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookmarkDto, currentUserId: string, role: string) {
    if (dto.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only bookmark for yourself');
    }

    return this.prisma.bookmark.create({ data: { userId: dto.userId, episodeId: dto.episodeId } });
  }

  findByUser(userId: string) {
    return this.prisma.bookmark.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async remove(id: string, currentUserId: string, role: string) {
    const bookmark = await this.prisma.bookmark.findUnique({ where: { id } });
    if (!bookmark) throw new NotFoundException('Bookmark not found');
    if (bookmark.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only delete your own bookmarks');
    }

    await this.prisma.bookmark.delete({ where: { id } });
    return { deleted: true };
  }
}
