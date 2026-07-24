import { PartialType } from '@nestjs/mapped-types';
import { CreateLeaderDto } from './create-leader.dto';

export class UpdateLeaderDto extends PartialType(CreateLeaderDto) {}
