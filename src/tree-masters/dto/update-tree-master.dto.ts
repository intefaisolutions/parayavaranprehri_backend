import { PartialType } from '@nestjs/mapped-types';
import { CreateTreeMasterDto } from './create-tree-master.dto';

export class UpdateTreeMasterDto extends PartialType(CreateTreeMasterDto) {}
