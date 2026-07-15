import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
import { FeedOperationalRequestDto } from './dto/operational-request.dto';
import {
  CheckpointDetailsDto,
  CheckpointSummaryDto,
  FeedStateResponseDto,
  RecoveryResponseDto,
  RestoreCheckpointResponseDto,
  RetryResponseDto,
} from './dto/operational-response.dto';
import { FeedsOperationalService } from './feeds-operational.service';

@ApiTags('Feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feeds')
export class FeedsOperationalController {
  constructor(private readonly operationalService: FeedsOperationalService) {}

  private buildOperationalOptions(
    dto: FeedOperationalRequestDto | undefined,
    req: Request & { user?: { id?: string; role?: string } },
  ) {
    const options = dto?.options;
    return {
      ...(options?.force !== undefined ? { force: options.force } : {}),
      ...(options?.dryRun !== undefined ? { dryRun: options.dryRun } : {}),
      ...(options?.reason !== undefined ? { reason: options.reason } : {}),
      ...(options?.priority !== undefined ? { priority: options.priority } : {}),
      ...(options?.correlationId !== undefined ? { correlationId: options.correlationId } : {}),
      ...(options?.requestedBy !== undefined || req.user?.id !== undefined
        ? { requestedBy: options?.requestedBy ?? req.user?.id }
        : {}),
      ...(options?.ignoreValidation !== undefined
        ? { ignoreValidation: options.ignoreValidation }
        : {}),
      ...(options?.metadata !== undefined ? { metadata: options.metadata } : {}),
    };
  }

  @Get(':id/state')
  @ApiOperation({ summary: 'Return the current synchronization state for a feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({
    status: 200,
    description: 'Feed state returned successfully',
    type: FeedStateResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getFeedState(@Param('id') id: string) {
    return this.operationalService.getFeedState(id);
  }

  @Get(':id/checkpoints')
  @ApiOperation({ summary: 'Return checkpoint history for a feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({
    status: 200,
    description: 'Checkpoint history returned successfully',
    type: [CheckpointSummaryDto],
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getCheckpoints(@Param('id') id: string) {
    return this.operationalService.getCheckpoints(id);
  }

  @Get(':id/checkpoints/:checkpointId')
  @ApiOperation({ summary: 'Return a specific checkpoint for a feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiParam({ name: 'checkpointId', description: 'Checkpoint identifier' })
  @ApiResponse({
    status: 200,
    description: 'Checkpoint returned successfully',
    type: CheckpointDetailsDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found' })
  getCheckpoint(@Param('id') id: string, @Param('checkpointId') checkpointId: string) {
    return this.operationalService.getCheckpoint(id, checkpointId);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Request retry evaluation for a feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiBody({ type: FeedOperationalRequestDto, required: false })
  @ApiResponse({ status: 202, description: 'Retry evaluation requested', type: RetryResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  requestRetry(
    @Param('id') id: string,
    @Body() dto: FeedOperationalRequestDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.operationalService.requestRetry(id, {
      ...dto,
      options: this.buildOperationalOptions(dto, req),
    });
  }

  @Post(':id/recover')
  @ApiOperation({ summary: 'Request recovery evaluation for a feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiBody({ type: FeedOperationalRequestDto, required: false })
  @ApiResponse({
    status: 202,
    description: 'Recovery evaluation requested',
    type: RecoveryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  requestRecovery(
    @Param('id') id: string,
    @Body() dto: FeedOperationalRequestDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.operationalService.requestRecovery(id, {
      ...dto,
      options: this.buildOperationalOptions(dto, req),
    });
  }

  @Post(':id/checkpoints/:checkpointId/restore')
  @ApiOperation({ summary: 'Request restoration from an existing checkpoint' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiParam({ name: 'checkpointId', description: 'Checkpoint identifier' })
  @ApiBody({ type: FeedOperationalRequestDto, required: false })
  @ApiResponse({
    status: 202,
    description: 'Restore request accepted',
    type: RestoreCheckpointResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Checkpoint not found' })
  restoreCheckpoint(
    @Param('id') id: string,
    @Param('checkpointId') checkpointId: string,
    @Body() dto: FeedOperationalRequestDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.operationalService.restoreCheckpoint(id, checkpointId, {
      ...dto,
      options: this.buildOperationalOptions(dto, req),
    });
  }
}
