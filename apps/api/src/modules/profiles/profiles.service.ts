import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(userId: string) {
    const profile = await this.prisma.profile.findFirst({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true } },
      },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async update(userId: string, dto: UpdateProfileDto, currentUserId: string, role: string) {
    if (currentUserId !== userId && role !== 'admin') {
      throw new ForbiddenException('You can only update your own profile');
    }

    const existing = await this.prisma.profile.findFirst({ where: { userId } });
    if (existing) {
      return this.prisma.profile.update({
        where: { id: existing.id },
        data: {
          ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
          ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        },
        include: {
          user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true } },
        },
      });
    }

    return this.prisma.profile.create({
      data: {
        userId,
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        locale: dto.locale ?? 'en',
      },
      include: {
        user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true } },
      },
    });
  }
}
