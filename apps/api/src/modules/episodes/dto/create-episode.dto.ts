import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateEpisodeDto {
  @ApiProperty({ example: 'podcast-id' })
  @IsString()
  podcastId: string;

  @ApiProperty({ example: 'Launching a Better UX' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'launching-a-better-ux' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'https://example.com/audio.mp3' })
  @IsString()
  audioUrl: string;

  @ApiPropertyOptional({ example: 'A useful discussion' })
  @IsOptional()
  @IsString()
  description?: string;
}
