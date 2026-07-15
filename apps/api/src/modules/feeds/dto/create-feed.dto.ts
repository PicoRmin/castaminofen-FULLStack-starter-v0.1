import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFeedDto {
  @ApiProperty({ example: 'https://example.com/feed.xml', description: 'The RSS or Atom feed URL to register' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional({ example: 'My Podcast Feed', description: 'Optional human-readable title for the feed' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com', description: 'Optional website URL associated with the feed' })
  @IsOptional()
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false })
  @MaxLength(2048)
  websiteUrl?: string;

  @ApiPropertyOptional({ example: 'podcast', description: 'Optional provider identifier or category hint' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  provider?: string;
}
