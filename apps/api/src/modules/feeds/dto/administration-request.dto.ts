import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFeedDto {
  @ApiPropertyOptional({ example: 'Updated Feed Title', description: 'Editable display name' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Editable description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'news', description: 'Feed category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: ['technology', 'news'], description: 'Feed tags' })
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'en', description: 'Primary language' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @ApiPropertyOptional({ example: 'public', description: 'Feed visibility' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  visibility?: string;

  @ApiPropertyOptional({ type: Object, description: 'Custom settings' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, unknown>;
}

export class FeedConfigurationValueDto {
  @ApiPropertyOptional({ example: true, description: 'Whether synchronization is enabled' })
  @IsOptional()
  @IsBoolean()
  syncEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether import is enabled' })
  @IsOptional()
  @IsBoolean()
  importEnabled?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Whether health evaluation is enabled' })
  @IsOptional()
  @IsBoolean()
  healthEvaluationEnabled?: boolean;

  @ApiPropertyOptional({ example: 'fixed-delay', description: 'Retry policy identifier' })
  @IsOptional()
  @IsString()
  retryPolicy?: string;

  @ApiPropertyOptional({ example: 'none', description: 'Recovery policy identifier' })
  @IsOptional()
  @IsString()
  recoveryPolicy?: string;

  @ApiPropertyOptional({ example: 5, description: 'Operational priority' })
  @IsOptional()
  @IsString()
  priority?: number;

  @ApiPropertyOptional({ example: 'default', description: 'Retention policy identifier' })
  @IsOptional()
  @IsString()
  retentionPolicy?: string;

  @ApiPropertyOptional({ example: 'default', description: 'Scheduling policy identifier' })
  @IsOptional()
  @IsString()
  schedulingPolicy?: string;

  @ApiPropertyOptional({ type: Object, description: 'Provider-specific overrides' })
  @IsOptional()
  @IsObject()
  providerOverrides?: Record<string, unknown>;

  @ApiPropertyOptional({ type: Object, description: 'Metadata policy values' })
  @IsOptional()
  @IsObject()
  metadataPolicy?: Record<string, unknown>;
}

export class UpdateConfigurationDto {
  @ApiProperty({ type: FeedConfigurationValueDto, description: 'Partial configuration update' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FeedConfigurationValueDto)
  configuration!: FeedConfigurationValueDto;
}

export class FeedAdministrationIdParamDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Feed identifier' })
  @IsUUID()
  id!: string;
}
