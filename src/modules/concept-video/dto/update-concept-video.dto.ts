import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateConceptVideoDto {
  @ApiPropertyOptional({ example: 'What is Paryavaran Prahri?' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example:
      'Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.',
  })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 'dQw4w9WgXcQ' })
  @IsString()
  @IsOptional()
  youtubeId?: string;

  @ApiPropertyOptional({
    example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
