import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MitraEventAttendanceDocument =
  HydratedDocument<MitraEventAttendance>;

export enum AttendanceStatus {
  PRESENT = 'Present',
  ABSENT = 'Absent',
}

@Schema({ timestamps: true, collection: 'mitra_event_attendance' })
export class MitraEventAttendance extends BaseSchema {
  @Prop({ type: Types.ObjectId, ref: 'MitraEvent', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  mitraId!: string;

  @Prop({ trim: true, index: true })
  userId?: string;

  @Prop({ trim: true })
  mitraName?: string;

  @Prop({
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status!: AttendanceStatus;

  @Prop({ type: Date, default: Date.now })
  attendedAt!: Date;

  @Prop({ trim: true })
  notes?: string;
}

export const MitraEventAttendanceSchema =
  SchemaFactory.createForClass(MitraEventAttendance);

MitraEventAttendanceSchema.index(
  { eventId: 1, mitraId: 1 },
  { unique: true },
);
