import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;
}
