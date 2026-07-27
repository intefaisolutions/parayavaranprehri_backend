import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignMitraDto {
  @IsMongoId()
  @IsNotEmpty()
  mitraId!: string;
}
