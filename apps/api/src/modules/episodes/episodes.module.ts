import { Module } from '@nestjs/common';
import { EpisodesController } from './episodes.controller';
import { EpisodesService } from './episodes.service';
import { EpisodesRepository } from './episodes.repository';

@Module({
  controllers: [EpisodesController],
  providers: [EpisodesService, EpisodesRepository],
})
export class EpisodesModule {}
