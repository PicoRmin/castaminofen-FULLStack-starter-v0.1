import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({ example: 'owner-id' })
  @IsString()
  ownerId: string;

  @ApiProperty({ example: 'Northstar Podcasts' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'northstar-podcasts' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'A modern podcast channel' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
