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

  /** Land parcel where this tree is planted. */
  @Prop({ type: Types.ObjectId, ref: 'Land', default: null, index: true })
  landId?: Types.ObjectId | null;

  @Prop({ trim: true })
  landName?: string;

  @Prop({
    enum: ['INDIVIDUAL', 'PLANTATION_DRIVE', 'CSR', 'GOVERNMENT_SCHEME'],
  })
  plantationMethod?: string;

  @Prop({ trim: true })
  responsibleOrganization?: string;

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

  /** Trunk diameter at breast height (cm) — improves O₂ estimate accuracy. */
  @Prop({ type: Number, default: null })
  dbh?: number | null;

  /** Auto-derived: years since plantation date. */
  @Prop({ type: Number, default: 0 })
  treeAgeYears!: number;

  /** Auto-derived annual O₂ estimate (kg/year). Never accept from client. */
  @Prop({ type: Number, default: 0 })
  annualOxygenProductionKg!: number;

  /** Constituency this tree counts toward (name match with Vidhan Sabha). */
  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop()
  remarks!: string;

  @Prop()
  image!: string;
}

export const TreeSchema = SchemaFactory.createForClass(Tree);
