import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type VehicleTreeRuleDocument = HydratedDocument<VehicleTreeRule>;

@Schema({ timestamps: true, collection: 'vehicle_tree_rules' })
export class VehicleTreeRule extends BaseSchema {
  @Prop({ required: true, trim: true, unique: true })
  vehicleType!: string;

  @Prop({ required: true, min: 0 })
  treesRequired!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const VehicleTreeRuleSchema = SchemaFactory.createForClass(VehicleTreeRule);

VehicleTreeRuleSchema.index({
  vehicleType: 'text',
});
