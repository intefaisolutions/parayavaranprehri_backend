import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleTreeRuleDto } from './create-vehicle-tree-rule.dto';

export class UpdateVehicleTreeRuleDto extends PartialType(CreateVehicleTreeRuleDto) {}
