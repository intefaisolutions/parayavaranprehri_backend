import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PersonIdentityDocument = HydratedDocument<PersonIdentity>;

export enum VehicleStickerStatus {
  GENERATED = 'Generated',
  PENDING = 'Pending',
}

export enum PersonIdentityStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'person_identities' })
export class PersonIdentity extends BaseSchema {
  @Prop({ unique: true, index: true })
  identityId!: string;

  @Prop({ type: Types.ObjectId, ref: 'Person' })
  person?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  personName!: string;

  @Prop({ trim: true })
  personMobile?: string;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  qrCode?: string;

  @Prop({
    enum: VehicleStickerStatus,
    default: VehicleStickerStatus.PENDING,
    index: true,
  })
  vehicleStickerStatus!: VehicleStickerStatus;

  @Prop({ type: Date, default: Date.now })
  generatedDate!: Date;

  @Prop({
    enum: PersonIdentityStatus,
    default: PersonIdentityStatus.ACTIVE,
    index: true,
  })
  status!: PersonIdentityStatus;
}

export const PersonIdentitySchema = SchemaFactory.createForClass(PersonIdentity);

PersonIdentitySchema.index({
  personName: 'text',
  identityId: 'text',
  qrCode: 'text',
  personMobile: 'text',
});
