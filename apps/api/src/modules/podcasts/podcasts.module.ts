import { Module } from '@nestjs/common';
import { PodcastsController } from './podcasts.controller';
import { PodcastsService } from './podcasts.service';
import { PodcastsRepository } from './podcasts.repository';

@Module({
  controllers: [PodcastsController],
  providers: [PodcastsService, PodcastsRepository],
})
export class PodcastsModule {}
