import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type CallCenterContactDocument = HydratedDocument<CallCenterContact>;

export enum CallCenterContactType {
  PHONE = 'Phone',
  EMAIL = 'Email',
  WHATSAPP = 'WhatsApp',
  CHAT = 'Chat',
}

export enum CallCenterContactStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'call_center_contacts' })
export class CallCenterContact extends BaseSchema {
  @Prop({ enum: CallCenterContactType, default: CallCenterContactType.PHONE })
  contactType!: CallCenterContactType;

  @Prop({ required: true, trim: true })
  contactValue!: string;

  @Prop({ trim: true })
  availableHours?: string;

  @Prop({ trim: true })
  assignedPerson?: string;

  @Prop({ type: Date, default: Date.now })
  lastUpdated!: Date;

  @Prop({ enum: CallCenterContactStatus, default: CallCenterContactStatus.ACTIVE, index: true })
  status!: CallCenterContactStatus;
}

export const CallCenterContactSchema = SchemaFactory.createForClass(CallCenterContact);

CallCenterContactSchema.index({
  contactValue: 'text',
  assignedPerson: 'text',
});
