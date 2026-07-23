import { PartialType } from '@nestjs/mapped-types';
import { CreateMitraDto } from './create-mitra.dto';

export class UpdateMitraDto extends PartialType(CreateMitraDto) {}
