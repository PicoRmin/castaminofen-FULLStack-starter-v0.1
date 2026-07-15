import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FeedOperationalMetadataDto {
  @ApiPropertyOptional({ description: 'Force the requested operational action', example: false })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Request a dry-run style evaluation without execution',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Human-readable reason for the operational request',
    example: 'Manual operational review',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ description: 'Priority for the operational request', example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Correlation identifier for observability',
    example: 'op-123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  correlationId?: string;

  @ApiPropertyOptional({ description: 'Actor or requester identifier', example: 'user-123' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  requestedBy?: string;

  @ApiPropertyOptional({ description: 'Skip validation for future extensions', example: false })
  @IsOptional()
  @IsBoolean()
  ignoreValidation?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for operational extensions',
    example: { source: 'admin' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class FeedOperationalRequestDto {
  @ApiPropertyOptional({
    type: FeedOperationalMetadataDto,
    description: 'Optional operational metadata for the request',
  })
  @IsOptional()
  @Type(() => FeedOperationalMetadataDto)
  options?: FeedOperationalMetadataDto;
}
