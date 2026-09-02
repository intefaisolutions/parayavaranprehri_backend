import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleTreeRulesController } from './vehicle-tree-rules.controller';
import { VehicleTreeRulesService } from './vehicle-tree-rules.service';
import { VehicleTreeRule, VehicleTreeRuleSchema } from './schemas/vehicle-tree-rule.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VehicleTreeRule.name, schema: VehicleTreeRuleSchema },
    ]),
  ],
  controllers: [VehicleTreeRulesController],
  providers: [VehicleTreeRulesService],
  exports: [VehicleTreeRulesService],
})
export class VehicleTreeRulesModule {}
