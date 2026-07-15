import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'technology' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'technology' })
  @IsString()
  slug: string;
}
