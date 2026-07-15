import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export {
  CheckpointDetailsDto,
  CheckpointSummaryDto,
  FeedStateResponseDto,
  RecoveryResponseDto,
  RestoreCheckpointResponseDto,
  RetryResponseDto,
} from './operational-response.dto';

export class FeedHealthClassificationDto {
  @ApiProperty({ example: 'healthy-feed' })
  id: string;

  @ApiProperty({ example: 'Healthy Feed' })
  label: string;

  @ApiProperty({ example: 'Health metrics are within expected ranges.' })
  reason: string;

  @ApiProperty({ example: 'info' })
  severity: 'info' | 'warning' | 'critical';
}

export class FeedHealthWarningDto {
  @ApiProperty({ example: 'provider-instability' })
  code: string;

  @ApiProperty({ example: 'Provider availability is below expected reliability.' })
  message: string;

  @ApiProperty({ example: 'critical' })
  severity: 'info' | 'warning' | 'critical';
}

export class FeedMonitoringTrendDto {
  @ApiProperty({ example: 'Stable' })
  direction: string;

  @ApiProperty({ example: 0.7 })
  confidence: number;

  @ApiPropertyOptional({ example: 84 })
  previousScore?: number;

  @ApiPropertyOptional({ example: 87 })
  currentScore?: number;
}

export class FeedHealthMonitoringResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId: string;

  @ApiProperty({ example: 'Healthy' })
  status: string;

  @ApiProperty({ example: 87 })
  healthScore: number;

  @ApiProperty({ type: FeedHealthClassificationDto })
  classification: FeedHealthClassificationDto;

  @ApiProperty({ type: [FeedHealthWarningDto] })
  warnings: FeedHealthWarningDto[];

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z' })
  evaluatedAt: string;

  @ApiProperty({ type: Object })
  metadata: Record<string, unknown>;

  @ApiProperty({ type: FeedMonitoringTrendDto })
  trend: FeedMonitoringTrendDto;

  @ApiProperty({ type: Object })
  statistics: Record<string, number | undefined>;
}

export class FeedMetricsSummaryDto {
  @ApiProperty({ example: 12 })
  synchronizationCount: number;

  @ApiProperty({ example: 2 })
  failureCount: number;

  @ApiProperty({ example: 1 })
  retryCount: number;

  @ApiProperty({ example: 1 })
  recoveryCount: number;

  @ApiProperty({ example: 2400 })
  averageSynchronizationDurationMs: number;

  @ApiProperty({ example: 600 })
  averageImportDurationMs: number;

  @ApiProperty({ example: 900 })
  averageDownloadDurationMs: number;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z', nullable: true })
  lastSynchronizationAt: string | null;

  @ApiProperty({ example: 0.95 })
  successRate: number;

  @ApiProperty({ example: 0.01 })
  failureRate: number;

  @ApiProperty({ example: 2400 })
  checkpointAgeMs: number;

  @ApiProperty({ example: 1000 })
  queueWaitingTimeMs: number;

  @ApiProperty({ example: 0.95 })
  providerAvailability: number;

  @ApiProperty({ example: 1 })
  metadataChanges: number;
}

export class FeedMetricsResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId: string;

  @ApiProperty({ type: FeedMetricsSummaryDto })
  summary: FeedMetricsSummaryDto;

  @ApiProperty({ type: Object })
  metadata: Record<string, unknown>;
}

export class FeedStatisticsSummaryDto {
  @ApiProperty({ example: 12 })
  totalSynchronizations: number;

  @ApiProperty({ example: 11 })
  successfulSynchronizations: number;

  @ApiProperty({ example: 1 })
  failedSynchronizations: number;

  @ApiProperty({ example: 2400 })
  averageDurationMs: number;

  @ApiProperty({ example: 2400 })
  medianDurationMs: number;

  @ApiProperty({ example: 3400 })
  peakDurationMs: number;

  @ApiProperty({ example: 2 })
  averageFeedGrowth: number;

  @ApiProperty({ example: 2 })
  averageEpisodeGrowth: number;

  @ApiProperty({ example: 2 })
  synchronizationFrequency: number;

  @ApiProperty({ type: Object })
  historicalSummary: Record<string, number | string | undefined>;

  @ApiProperty({ type: Object })
  trendSummary: Record<string, number | string | undefined>;
}

export class FeedStatisticsResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId: string;

  @ApiProperty({ type: FeedStatisticsSummaryDto })
  summary: FeedStatisticsSummaryDto;

  @ApiProperty({ type: Object })
  metadata: Record<string, unknown>;
}
