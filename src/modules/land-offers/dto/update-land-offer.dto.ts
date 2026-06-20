import { PartialType } from '@nestjs/swagger';
import { CreateLandOfferDto } from './create-land-offer.dto';

export class UpdateLandOfferDto extends PartialType(CreateLandOfferDto) {}
