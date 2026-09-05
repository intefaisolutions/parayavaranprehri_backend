import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';

export const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?&/]\S*)?$/;

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
  @Matches(YOUTUBE_URL_REGEX, {
    message:
      'Invalid YouTube URL. Supported formats: https://www.youtube.com/watch?v=VIDEO_ID, https://youtu.be/VIDEO_ID, or https://www.youtube.com/shorts/VIDEO_ID',
  })
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
