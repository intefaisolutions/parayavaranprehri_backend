import { PartialType } from '@nestjs/mapped-types';
import { CreateMitraEventDto } from './create-mitra-event.dto';

export class UpdateMitraEventDto extends PartialType(CreateMitraEventDto) {}
