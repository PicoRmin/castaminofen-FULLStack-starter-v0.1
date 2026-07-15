import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  UpdateConfigurationDto,
  UpdateFeedDto,
} from './dto/administration-request.dto';
import {
  ArchiveFeedResponseDto,
  ConfigurationResponseDto,
  DisableFeedResponseDto,
  EnableFeedResponseDto,
  RevalidateFeedResponseDto,
  ResetFeedResponseDto,
  UnarchiveFeedResponseDto,
  UpdateConfigurationResponseDto,
  UpdateFeedResponseDto,
} from './dto/administration-response.dto';
import { FeedsAdministrationService } from './feeds-administration.service';

@ApiTags('Feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('feeds')
export class FeedsAdministrationController {
  constructor(private readonly administrationService: FeedsAdministrationService) {}

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update editable feed metadata' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiBody({ type: UpdateFeedDto })
  @ApiResponse({ status: 200, description: 'Feed metadata updated', type: UpdateFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  updateFeed(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFeedDto) {
    return this.administrationService.updateFeed(id, dto);
  }

  @Post(':id/enable')
  @Roles('admin')
  @ApiOperation({ summary: 'Enable a feed without executing synchronization' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed enabled', type: EnableFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  enableFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.enableFeed(id);
  }

  @Post(':id/disable')
  @Roles('admin')
  @ApiOperation({ summary: 'Disable a feed while keeping it registered' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed disabled', type: DisableFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  disableFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.disableFeed(id);
  }

  @Post(':id/archive')
  @Roles('admin')
  @ApiOperation({ summary: 'Archive a feed without removing it' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed archived', type: ArchiveFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  archiveFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.archiveFeed(id);
  }

  @Post(':id/unarchive')
  @Roles('admin')
  @ApiOperation({ summary: 'Restore an archived feed' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed unarchived', type: UnarchiveFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  unarchiveFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.unarchiveFeed(id);
  }

  @Post(':id/reset')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset feed administrative state' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Feed state reset', type: ResetFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  resetFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.resetFeed(id);
  }

  @Post(':id/revalidate')
  @Roles('admin')
  @ApiOperation({ summary: 'Request feed validation pipeline execution' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Validation requested', type: RevalidateFeedResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  revalidateFeed(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.revalidateFeed(id);
  }

  @Get(':id/configuration')
  @Roles('admin')
  @ApiOperation({ summary: 'Return feed configuration snapshot' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({ status: 200, description: 'Configuration returned', type: ConfigurationResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getConfiguration(@Param('id', ParseUUIDPipe) id: string) {
    return this.administrationService.getConfiguration(id);
  }

  @Patch(':id/configuration')
  @Roles('admin')
  @ApiOperation({ summary: 'Update feed configuration values' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiBody({ type: UpdateConfigurationDto })
  @ApiResponse({ status: 200, description: 'Configuration updated', type: UpdateConfigurationResponseDto })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 403, description: 'Administrative access required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  updateConfiguration(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateConfigurationDto) {
    return this.administrationService.updateConfiguration(id, dto);
  }
}
