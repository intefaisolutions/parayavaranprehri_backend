import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateContentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content!: string;
}
