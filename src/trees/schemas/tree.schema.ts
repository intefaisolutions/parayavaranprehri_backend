import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  // Optional link to the Person master record (the insured customer this
  // tree belongs to), if the owner has also been registered as a Person.
  @Prop({ type: Types.ObjectId, ref: 'Person', default: null })
  personId?: Types.ObjectId | null;

  // The Mitra (volunteer) assigned to take care of this tree.
  @Prop({ type: Types.ObjectId, ref: 'Mitra', default: null })
  assignedMitraId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null })
  assignedMitraName?: string | null;

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
