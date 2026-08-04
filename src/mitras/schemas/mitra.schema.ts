import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MitraDocument = HydratedDocument<Mitra>;

export enum MitraMembership {
  FREE = 'free',
  PREMIUM = 'premium',
}

export enum MitraStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  CANCELLED = 'Cancelled',
}

export enum MitraSource {
  APP = 'app',
  ADMIN = 'admin',
}

/** How trees under an optional land are linked to this Mitra */
export enum MitraTreeAssignment {
  NONE = 'NONE',
  ALL = 'ALL',
  SINGLE = 'SINGLE',
}

@Schema({ timestamps: true, collection: 'mitras' })
export class Mitra extends BaseSchema {
  @Prop({ unique: true, index: true })
  mitraId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  mobile!: string;

  @Prop({ trim: true, lowercase: true, unique: true, sparse: true, index: true })
  email?: string;

  @Prop({ trim: true })
  profession?: string;

  @Prop({ trim: true })
  address?: string;

  /** Required operating constituency (name) */
  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop({ trim: true })
  assignedZone?: string;

  @Prop({ trim: true, index: true })
  district?: string;

  @Prop({ trim: true, index: true })
  state?: string;

  /** Optional land under the Vidhan Sabha */
  @Prop({ type: Types.ObjectId, ref: 'Land', default: null, index: true })
  landId?: Types.ObjectId | null;

  @Prop({ trim: true })
  landName?: string;

  @Prop({
    enum: MitraTreeAssignment,
    default: MitraTreeAssignment.NONE,
  })
  treeAssignment?: MitraTreeAssignment;

  /** When treeAssignment === SINGLE */
  @Prop({ type: Types.ObjectId, ref: 'Tree', default: null })
  assignedTreeId?: Types.ObjectId | null;

  @Prop({ trim: true })
  assignedTreeName?: string;

  @Prop({ enum: MitraMembership, default: MitraMembership.FREE })
  membership!: MitraMembership;

  @Prop({ enum: MitraStatus, default: MitraStatus.PENDING, index: true })
  status!: MitraStatus;

  // Self-registered (app) Mitras start Pending and need admin review;
  // admin-created Mitras default to Approved. Tracked so the UI/API can
  // tell the two onboarding paths apart.
  @Prop({ enum: MitraSource, default: MitraSource.ADMIN, index: true })
  source!: MitraSource;

  @Prop({ type: Date, default: Date.now })
  joinedDate!: Date;

  @Prop({ default: 0 })
  treesPlanted!: number;

  @Prop({ type: [String], default: [] })
  badges!: string[];

  @Prop({ trim: true })
  remarks?: string;
}

export const MitraSchema = SchemaFactory.createForClass(Mitra);

MitraSchema.index({ name: 'text', mobile: 'text', mitraId: 'text' });
