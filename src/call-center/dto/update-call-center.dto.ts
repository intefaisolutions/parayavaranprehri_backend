import { PartialType } from '@nestjs/mapped-types';
import { CreateCallCenterDto } from './create-call-center.dto';

export class UpdateCallCenterDto extends PartialType(CreateCallCenterDto) {}
