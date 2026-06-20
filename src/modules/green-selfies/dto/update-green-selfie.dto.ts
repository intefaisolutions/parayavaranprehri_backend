import { PartialType } from '@nestjs/swagger';
import { CreateGreenSelfieDto } from './create-green-selfie.dto';

export class UpdateGreenSelfieDto extends PartialType(CreateGreenSelfieDto) {}
