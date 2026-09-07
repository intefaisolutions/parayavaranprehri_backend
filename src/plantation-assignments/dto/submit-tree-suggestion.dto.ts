import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitTreeSuggestionDto {
  @IsString()
  @IsNotEmpty()
  treeMasterId!: string;
}
