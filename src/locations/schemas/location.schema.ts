import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type LocationDocument = HydratedDocument<Location>;

export enum LocationType {
  STATE = 'State',
  DISTRICT = 'District',
  VIDHAN_SABHA = 'Vidhan Sabha',
  ZONE = 'Zone',
  SECTOR = 'Sector',
}

export enum LocationStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'locations' })
export class Location extends BaseSchema {
  @Prop({ required: true, trim: true })
  locationName!: string;

  @Prop({ required: true, enum: LocationType, index: true })
  locationType!: LocationType;

  @Prop({ trim: true })
  parentLocation?: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ type: Number, default: 0 })
  totalLinkedRecords!: number;

  @Prop({ enum: LocationStatus, default: LocationStatus.ACTIVE, index: true })
  status!: LocationStatus;
}

export const LocationSchema = SchemaFactory.createForClass(Location);

LocationSchema.index({
  locationName: 'text',
  parentLocation: 'text',
});
