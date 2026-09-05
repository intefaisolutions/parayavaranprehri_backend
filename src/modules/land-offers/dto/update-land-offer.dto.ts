import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn } from 'class-validator';
import { CreateLandOfferDto } from './create-land-offer.dto';

export class UpdateLandOfferDto extends PartialType(CreateLandOfferDto) {
  @IsString()
  @IsOptional()
  @IsIn(['Pending', 'Selected', 'Rejected'])
  status?: string;
}
