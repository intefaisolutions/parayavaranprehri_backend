import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssignmentStatus } from '../schemas/plantation-assignment.schema';

export class UpdateAssignmentStatusDto {
  @IsEnum(AssignmentStatus)
  @IsNotEmpty()
  status!: AssignmentStatus;

  @IsString()
  @IsOptional()
  mitraId?: string;
}
