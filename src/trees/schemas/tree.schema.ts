import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TreeDocument = Tree & Document;

@Schema({ timestamps: true })
export class Tree {
  @Prop({ unique: true })
  treeId!: string;

  // Tree Details
  @Prop({ required: true })
  treeName!: string;

  @Prop()
  species!: string;

  @Prop()
  scientificName!: string;

  // User Details
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  userName!: string;

  @Prop({ required: true })
  mobile!: string;

  // Vehicle Details
  @Prop()
  vehicleNumber!: string;

  @Prop()
  policyNumber!: string;

  @Prop({
    enum: ['ACTIVE', 'EXPIRED', 'NOT_INSURED'],
    default: 'NOT_INSURED',
  })
  insuranceStatus!: string;

  // Plantation Details
  @Prop()
  plantedDate!: Date;

  @Prop()
  plantedBy!: string;

  // Location
  @Prop()
  state!: string;

  @Prop()
  district!: string;

  @Prop()
  city!: string;

  @Prop()
  location!: string;

  @Prop()
  latitude!: number;

  @Prop()
  longitude!: number;

  // Tree Health
  @Prop({
    enum: ['PLANTED', 'HEALTHY', 'GROWING', 'DAMAGED', 'DEAD'],
    default: 'PLANTED',
  })
  status!: string;

  @Prop()
  height!: number;

  @Prop()
  remarks!: string;

  @Prop()
  image!: string;
}

export const TreeSchema = SchemaFactory.createForClass(Tree);
