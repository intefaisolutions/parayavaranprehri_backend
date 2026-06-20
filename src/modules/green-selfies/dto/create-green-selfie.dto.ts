import { IsString, IsNotEmpty, IsUrl } from 'class-validator';

export class CreateGreenSelfieDto {
  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  imageUrl!: string;
}
