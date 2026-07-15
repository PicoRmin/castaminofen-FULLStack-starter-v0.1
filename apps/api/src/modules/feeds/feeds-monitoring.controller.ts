import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  FeedHealthMonitoringResponseDto,
  FeedMetricsResponseDto,
  FeedStatisticsResponseDto,
} from './dto/monitoring-response.dto';
import { FeedMonitoringService } from './feeds-monitoring.service';

@ApiTags('Feeds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('feeds')
export class FeedsMonitoringController {
  constructor(private readonly monitoringService: FeedMonitoringService) {}

  @Get(':id/health')
  @ApiOperation({ summary: 'Return feed health information' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({
    status: 200,
    description: 'Health returned successfully',
    type: FeedHealthMonitoringResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getHealth(@Param('id') id: string) {
    return this.monitoringService.getFeedHealth(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Return aggregated feed statistics' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({
    status: 200,
    description: 'Statistics returned successfully',
    type: FeedStatisticsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getStatistics(@Param('id') id: string) {
    return this.monitoringService.getFeedStatistics(id);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Return feed synchronization metrics' })
  @ApiParam({ name: 'id', description: 'Feed identifier' })
  @ApiResponse({
    status: 200,
    description: 'Metrics returned successfully',
    type: FeedMetricsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required' })
  @ApiResponse({ status: 404, description: 'Feed not found' })
  getMetrics(@Param('id') id: string) {
    return this.monitoringService.getFeedMetrics(id);
  }
}
