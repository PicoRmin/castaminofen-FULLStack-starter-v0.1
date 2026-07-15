import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  validate,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

@ValidatorConstraint({ async: true })
class SyncFeedOptionsValidator implements ValidatorConstraintInterface {
  async validate(value: unknown): Promise<boolean> {
    if (value == null) {
      return true;
    }

    const instance = plainToInstance(SyncFeedOptionsDto, value as object);
    const errors = await validate(instance, { whitelist: true });
    return errors.length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains invalid synchronization options`;
  }
}

export class SyncFeedOptionsDto {
  @ApiPropertyOptional({
    description: 'Synchronization mode to request',
    enum: ['manual', 'automatic', 'incremental', 'full', 'validation', 'preview', 'dry-run'],
    example: 'incremental',
  })
  @IsOptional()
  @IsString()
  @IsIn(['manual', 'automatic', 'incremental', 'full', 'validation', 'preview', 'dry-run'])
  mode?: 'manual' | 'automatic' | 'incremental' | 'full' | 'validation' | 'preview' | 'dry-run';

  @ApiPropertyOptional({
    description: 'Force a full synchronization even when the feed appears unchanged',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiPropertyOptional({
    description: 'Request a dry run without persisting changes',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean;

  @ApiPropertyOptional({ description: 'Request validation-only execution', example: false })
  @IsOptional()
  @IsBoolean()
  validateOnly?: boolean;

  @ApiPropertyOptional({ description: 'Request preview mode', example: false })
  @IsOptional()
  @IsBoolean()
  preview?: boolean;

  @ApiPropertyOptional({
    description: 'Priority value used by the orchestration layer',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Optional human-readable reason for the synchronization request',
    example: 'Manual refresh requested',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({
    description: 'Correlation identifier for tracing and observability',
    example: 'sync-123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  correlationId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for future synchronization extensions',
    example: { source: 'mobile' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SyncFeedRequestDto {
  @ApiPropertyOptional({
    type: SyncFeedOptionsDto,
    description: 'Optional synchronization options for the request',
  })
  @IsOptional()
  @Validate(SyncFeedOptionsValidator)
  @Type(() => SyncFeedOptionsDto)
  options?: SyncFeedOptionsDto;

  static fromPlain(value: unknown): SyncFeedRequestDto {
    return plainToInstance(SyncFeedRequestDto, value);
  }

  static async validatePlain(value: unknown): Promise<unknown[]> {
    const instance = SyncFeedRequestDto.fromPlain(value);
    const errors = await validate(instance, { whitelist: true });
    if (errors.length === 0 && instance.options && typeof instance.options === 'object') {
      const nested = await validate(instance.options as SyncFeedOptionsDto, { whitelist: true });
      return nested.length > 0 ? nested.map((error) => ({ ...error, property: 'options' })) : [];
    }
    if (errors.length > 0) {
      return errors.map((error) => ({
        ...error,
        property: error.property === 'options' ? 'options' : error.property,
      }));
    }
    return errors;
  }
}
