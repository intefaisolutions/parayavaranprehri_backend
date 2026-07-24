import { PartialType } from '@nestjs/mapped-types';
import { CreatePersonIdentityDto } from './create-person-identity.dto';

export class UpdatePersonIdentityDto extends PartialType(
  CreatePersonIdentityDto,
) {}
