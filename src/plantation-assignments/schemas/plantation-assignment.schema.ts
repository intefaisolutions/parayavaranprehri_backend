import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PlantationAssignmentDocument =
  HydratedDocument<PlantationAssignment>;

export enum AssignmentType {
  USER_SUGGESTED = 'USER_SUGGESTED',
  AUTO_ASSIGNED = 'AUTO_ASSIGNED',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PLANTED = 'PLANTED',
  VERIFIED = 'VERIFIED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

@Schema({ timestamps: true, collection: 'plantation_assignments' })
export class PlantationAssignment extends BaseSchema {
  @Prop({ unique: true, index: true })
  assignmentId!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'PlantationRequest',
    required: true,
    index: true,
  })
  plantationRequestId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, uppercase: true, index: true })
  insuranceId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', default: null })
  vehicleId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true, uppercase: true })
  vehiclePlate!: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'TreeMaster',
    required: true,
    index: true,
  })
  treeMasterId!: Types.ObjectId;

  @Prop({ trim: true })
  treeMasterName?: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Tree',
    default: null,
    index: true,
  })
  treeId?: Types.ObjectId | null;

  @Prop({ trim: true })
  treeCode?: string;

  @Prop({
    enum: AssignmentType,
    required: true,
    index: true,
  })
  assignmentType!: AssignmentType;

  @Prop({
    enum: AssignmentStatus,
    default: AssignmentStatus.ASSIGNED,
    index: true,
  })
  status!: AssignmentStatus;

  @Prop({ type: Date, default: () => new Date() })
  assignedAt!: Date;

  @Prop({ type: Date, default: null })
  plantedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'Mitra', default: null })
  mitraId?: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null })
  mitraName?: string | null;

  @Prop({ type: String, trim: true, default: null })
  qrCodeUrl?: string | null;
}

export const PlantationAssignmentSchema =
  SchemaFactory.createForClass(PlantationAssignment);

PlantationAssignmentSchema.index({ plantationRequestId: 1, treeId: 1 });
PlantationAssignmentSchema.index({ userId: 1, assignmentType: 1 });
