import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [users, podcasts, episodes, channels] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.podcast.count(),
      this.prisma.episode.count(),
      this.prisma.channel.count(),
    ]);

    return {
      message: 'Admin dashboard ready',
      metrics: { users, podcasts, episodes, channels },
      features: ['users', 'podcasts', 'metrics'],
    };
  }
}
