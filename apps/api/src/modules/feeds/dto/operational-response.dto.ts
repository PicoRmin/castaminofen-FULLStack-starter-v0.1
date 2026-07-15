import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedStateResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId!: string;

  @ApiProperty({ example: 'NeverSynced' })
  currentState!: string;

  @ApiProperty({ example: 1 })
  currentVersion!: number;

  @ApiProperty({ example: 0 })
  failureCount!: number;

  @ApiProperty({ example: 0 })
  successCount!: number;

  @ApiPropertyOptional({ example: 'checkpoint:feed-123:1' })
  checkpointReference?: string;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z' })
  stateTimestamp!: string;
}

export class CheckpointSummaryDto {
  @ApiProperty({ example: 'checkpoint:feed-123:1' })
  id!: string;

  @ApiProperty({ example: 'feed-123' })
  feedId!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: true })
  valid!: boolean;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z' })
  createdAt!: string;
}

export class CheckpointDetailsDto extends CheckpointSummaryDto {
  @ApiPropertyOptional({ example: 'etag-123' })
  etag?: string;

  @ApiPropertyOptional({ example: 'abc123' })
  feedHash?: string;

  @ApiPropertyOptional({ example: 12 })
  episodeCount?: number;

  @ApiPropertyOptional({ example: 'cursor-1' })
  synchronizationCursor?: string;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;
}

export class RetryResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId!: string;

  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Retry evaluation requested' })
  message!: string;

  @ApiPropertyOptional({ example: 'corr-123' })
  correlationId?: string;
}

export class RecoveryResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId!: string;

  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Recovery evaluation requested' })
  message!: string;

  @ApiPropertyOptional({ example: 'corr-123' })
  correlationId?: string;
}

export class RestoreCheckpointResponseDto {
  @ApiProperty({ example: 'feed-123' })
  feedId!: string;

  @ApiProperty({ example: 'checkpoint:feed-123:1' })
  checkpointId!: string;

  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Restore request accepted' })
  message!: string;

  @ApiPropertyOptional({ example: 'corr-123' })
  correlationId?: string;
}
