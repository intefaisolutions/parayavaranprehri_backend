import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MaintenanceLogDocument = HydratedDocument<MaintenanceLog>;

export enum MaintenanceActivity {
  WATERING = 'Watering',
  TREE_GUARD = 'Tree Guard',
  FERTILIZER = 'Fertilizer',
  PRUNING = 'Pruning',
  REPLACED = 'Replaced',
  SOIL = 'Soil',
  OTHER = 'Other',
}

@Schema({ timestamps: true, collection: 'maintenance_logs' })
export class MaintenanceLog extends BaseSchema {
  @Prop({ required: true, trim: true, index: true })
  treeCode!: string;

  @Prop({ enum: MaintenanceActivity, required: true, index: true })
  activity!: MaintenanceActivity;

  @Prop({ trim: true })
  remarks?: string;

  @Prop({ trim: true, index: true })
  mitraId?: string;

  @Prop({ trim: true, index: true })
  createdByUserId?: string;

  @Prop({ trim: true })
  createdByName?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  loggedAt!: Date;

  @Prop({ type: [String], default: [] })
  photoUrls!: string[];
}

export const MaintenanceLogSchema =
  SchemaFactory.createForClass(MaintenanceLog);
