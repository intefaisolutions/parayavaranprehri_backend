import { PartialType } from '@nestjs/mapped-types';
import { CreatePlantationDto } from './create-plantation.dto';

export class UpdatePlantationDto extends PartialType(CreatePlantationDto) {}
