import { PartialType } from '@nestjs/mapped-types';
import { CreateVidhanSabhaDto } from './create-vidhan-sabha.dto';

export class UpdateVidhanSabhaDto extends PartialType(CreateVidhanSabhaDto) {}
