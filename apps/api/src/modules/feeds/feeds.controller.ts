import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateFeedDto } from './dto/create-feed.dto';
import {
  DeleteFeedResponseDto,
  FeedListResponseDto,
  FeedResponseDto,
  ImportFeedResponseDto,
} from './dto/feed-response.dto';
import { SyncFeedRequestDto } from './dto/sync-feed.dto';
import {
  SyncAllFeedsResponseDto,
  SyncFeedResponseDto,
} from './dto/sync-response.dto';
import { FeedsService } from './feeds.service';
import { FeedsSynchronizationService } from './feeds-synchronization.service';

@ApiTags('Feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feeds')
export class FeedsController {
  constructor(
    private readonly feedsService: FeedsService,
    private readonly synchronizationService: FeedsSynchronizationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a new RSS feed' })
  @ApiResponse({ status: 201, description: 'Feed registered successfully', type: FeedResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  create(@Body() dto: CreateFeedDto, @Req() req: Request & { user?: { id?: string; role?: string } }) {
    return this.feedsService.create(dto, req.user?.id ?? 'system');
  }

  @Get()
  @ApiOperation({ summary: 'List registered feeds' })
  @ApiResponse({ status: 200, description: 'Feeds returned successfully', type: FeedListResponseDto })
  async findAll() {
    return this.feedsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single feed registration' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed returned successfully', type: FeedResponseDto })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  async findOne(@Param('id') id: string) {
    return this.feedsService.findOne(id);
  }

  @Post(':id/import')
  @ApiOperation({ summary: 'Trigger an initial import for an existing feed registration' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Import triggered', type: ImportFeedResponseDto })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  async importFeed(@Param('id') id: string) {
    return this.feedsService.triggerImport(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Trigger synchronization for a single feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiBody({ type: SyncFeedRequestDto, required: false })
  @ApiResponse({ status: 202, description: 'Synchronization accepted', type: SyncFeedResponseDto })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  @ApiResponse({ status: 409, description: 'Synchronization already running or locked' })
  async syncFeed(
    @Param('id') id: string,
    @Body() dto: SyncFeedRequestDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    const result = await this.synchronizationService.triggerSingleFeedSync(id, dto, req.user?.id);
    return {
      feedId: id,
      status: result.status,
      accepted: result.success,
      message: result.success ? 'Synchronization accepted' : 'Synchronization rejected',
      correlationId: result.metadata?.correlationId as string | undefined,
      mode: result.report?.mode ?? dto?.options?.mode ?? 'incremental',
      metadata: result.metadata,
    };
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Trigger synchronization for all registered feeds' })
  @ApiBody({ type: SyncFeedRequestDto, required: false })
  @ApiResponse({ status: 202, description: 'Synchronization accepted for all feeds', type: SyncAllFeedsResponseDto })
  async syncAllFeeds(
    @Body() dto: SyncFeedRequestDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.synchronizationService.triggerAllFeedsSync(dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove an existing feed registration' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed deleted successfully', type: DeleteFeedResponseDto })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  async remove(@Param('id') id: string) {
    return this.feedsService.remove(id);
  }
}
