import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PodcastsService } from './podcasts.service';

@ApiTags('Podcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('podcasts')
export class PodcastsController {
  constructor(private readonly podcastsService: PodcastsService) {}

  @Get()
  findAll() {
    return this.podcastsService.findAll();
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.podcastsService.search(query ?? '');
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.podcastsService.findBySlug(slug);
  }

  @Get(':slug/episodes')
  getEpisodes(@Param('slug') slug: string) {
    return this.podcastsService.findEpisodesByPodcastSlug(slug);
  }
}
