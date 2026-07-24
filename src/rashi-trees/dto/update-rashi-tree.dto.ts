import { PartialType } from '@nestjs/mapped-types';
import { CreateRashiTreeDto } from './create-rashi-tree.dto';

export class UpdateRashiTreeDto extends PartialType(CreateRashiTreeDto) {}
