import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  CallCenterContactStatus,
  CallCenterContactType,
} from '../schemas/call-center.schema';

export class CreateCallCenterDto {
  @IsEnum(CallCenterContactType)
  @IsOptional()
  contactType?: CallCenterContactType;

  @IsString()
  @IsNotEmpty()
  contactValue!: string;

  @IsString()
  @IsOptional()
  availableHours?: string;

  @IsString()
  @IsOptional()
  assignedPerson?: string;

  @IsEnum(CallCenterContactStatus)
  @IsOptional()
  status?: CallCenterContactStatus;
}
