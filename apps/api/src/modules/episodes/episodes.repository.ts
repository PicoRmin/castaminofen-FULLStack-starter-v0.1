import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class EpisodesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.episode.findMany();
  }
}
