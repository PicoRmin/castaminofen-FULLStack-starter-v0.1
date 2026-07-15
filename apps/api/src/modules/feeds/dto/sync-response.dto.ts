import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncFeedResponseDto {
  @ApiProperty({ example: 'feed_123' })
  feedId!: string;

  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Synchronization accepted' })
  message!: string;

  @ApiPropertyOptional({ example: 'corr-123' })
  correlationId?: string;

  @ApiPropertyOptional({ example: 'incremental' })
  mode?: string;

  @ApiPropertyOptional({ example: { strategy: 'incremental' } })
  metadata?: Record<string, unknown>;
}

export class SyncAllFeedsResponseDto {
  @ApiProperty({ example: 'accepted' })
  status!: string;

  @ApiProperty({ example: true })
  accepted!: boolean;

  @ApiProperty({ example: 'Synchronization request accepted for all feeds' })
  message!: string;

  @ApiProperty({ example: 2 })
  feedCount!: number;
}
