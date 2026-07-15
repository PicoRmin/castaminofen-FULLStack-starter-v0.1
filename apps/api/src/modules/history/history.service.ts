import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHistoryDto, currentUserId: string, role: string) {
    if (dto.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only update your own history');
    }

    return this.prisma.listeningHistory.create({
      data: { userId: dto.userId, episodeId: dto.episodeId, position: dto.position ?? 0 },
    });
  }

  findByUser(userId: string) {
    return this.prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async remove(id: string, currentUserId: string, role: string) {
    const entry = await this.prisma.listeningHistory.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('History entry not found');
    if (entry.userId !== currentUserId && role !== 'admin') {
      throw new ForbiddenException('You can only delete your own history');
    }

    await this.prisma.listeningHistory.delete({ where: { id } });
    return { deleted: true };
  }
}
