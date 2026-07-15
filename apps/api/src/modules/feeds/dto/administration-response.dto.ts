import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedAdministrationResponseDto {
  @ApiProperty({ example: 'feed-123', description: 'Feed identifier' })
  feedId: string;

  @ApiProperty({ example: 'updated', description: 'Administrative action status' })
  status: string;

  @ApiProperty({ example: 'Feed metadata updated', description: 'Human-readable message' })
  message: string;
}

export class FeedAdministrationMetadataResponseDto {
  @ApiPropertyOptional({ example: 'Updated Feed Title', description: 'Current display name' })
  displayName?: string | null;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Current description' })
  description?: string | null;

  @ApiPropertyOptional({ example: 'news', description: 'Current category' })
  category?: string | null;

  @ApiPropertyOptional({ example: ['technology'], description: 'Current tags' })
  tags?: string[];

  @ApiPropertyOptional({ example: 'en', description: 'Current language' })
  language?: string | null;

  @ApiPropertyOptional({ example: 'public', description: 'Current visibility' })
  visibility?: string | null;

  @ApiPropertyOptional({ type: Object, description: 'Custom settings' })
  customSettings?: Record<string, unknown>;
}

export class UpdateFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ type: FeedAdministrationMetadataResponseDto, description: 'Updated metadata values' })
  metadata: FeedAdministrationMetadataResponseDto;
}

export class EnableFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: true, description: 'Whether the feed is enabled' })
  enabled: boolean;
}

export class DisableFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: false, description: 'Whether the feed is enabled' })
  enabled: boolean;
}

export class ArchiveFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: true, description: 'Whether the feed is archived' })
  archived: boolean;
}

export class UnarchiveFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: false, description: 'Whether the feed is archived' })
  archived: boolean;
}

export class ResetFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: true, description: 'Whether the feed state was reset' })
  reset: boolean;
}

export class RevalidateFeedResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ example: true, description: 'Whether validation was re-requested' })
  revalidated: boolean;
}

export class ConfigurationResponseDto {
  @ApiProperty({ example: 'feed-123', description: 'Feed identifier' })
  feedId: string;

  @ApiProperty({ type: Object, description: 'Configuration snapshot' })
  configuration: Record<string, unknown>;

  @ApiProperty({ example: '2026-07-15T00:00:00.000Z', description: 'Timestamp for the configuration snapshot' })
  updatedAt: string;
}

export class UpdateConfigurationResponseDto extends FeedAdministrationResponseDto {
  @ApiProperty({ type: Object, description: 'Updated configuration snapshot' })
  configuration: Record<string, unknown>;
}
