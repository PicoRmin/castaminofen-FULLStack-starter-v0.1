import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedResponseDto {
  @ApiProperty({ example: 'feed_123' })
  id!: string;

  @ApiProperty({ example: 'Example Feed' })
  title!: string;

  @ApiProperty({ example: 'example-feed' })
  slug!: string;

  @ApiProperty({ example: 'https://example.com/feed.xml' })
  url!: string;

  @ApiPropertyOptional({ example: 'https://example.com' })
  websiteUrl?: string | null;

  @ApiPropertyOptional({ example: 'pending' })
  syncStatus?: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 'draft' })
  status!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: string;
}

export class FeedListResponseDto {
  @ApiProperty({ type: [FeedResponseDto] })
  items!: FeedResponseDto[];

  @ApiProperty({ example: 1 })
  total!: number;
}

export class ImportFeedResponseDto {
  @ApiProperty({ example: 'feed_123' })
  feedId!: string;

  @ApiProperty({ example: true })
  imported!: boolean;

  @ApiProperty({ example: 'Import initiated' })
  message!: string;
}

export class DeleteFeedResponseDto {
  @ApiProperty({ example: 'feed_123' })
  id!: string;

  @ApiProperty({ example: true })
  deleted!: boolean;
}
