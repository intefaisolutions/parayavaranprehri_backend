import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MapRecordDocument = HydratedDocument<MapRecord>;

export enum MapStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'maps' })
export class MapRecord extends BaseSchema {
  @Prop({ required: true, trim: true })
  locationName!: string;

  @Prop({ type: Number, default: 0 })
  treeCount!: number;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ trim: true })
  plantationArea?: string;

  @Prop({ trim: true })
  addedBy?: string;

  @Prop({ enum: MapStatus, default: MapStatus.ACTIVE, index: true })
  status!: MapStatus;
}

export const MapRecordSchema = SchemaFactory.createForClass(MapRecord);

MapRecordSchema.index({
  locationName: 'text',
  plantationArea: 'text',
  addedBy: 'text',
});
