import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type PersonDocument = HydratedDocument<Person>;

export enum PersonGender {
  MALE = 'Male',
  FEMALE = 'Female',
  OTHER = 'Other',
}

export enum PersonIdProofType {
  AADHAAR = 'Aadhaar',
  PAN = 'PAN',
  VOTER_ID = 'Voter ID',
  DRIVING_LICENSE = 'Driving License',
  PASSPORT = 'Passport',
}

export enum PersonStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'persons' })
export class Person extends BaseSchema {
  @Prop({ unique: true, index: true })
  personId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, unique: true, trim: true })
  mobile!: string;

  @Prop({ trim: true, lowercase: true })
  email?: string;

  @Prop({ type: Date })
  dob?: Date;

  @Prop({ enum: PersonGender })
  gender?: PersonGender;

  @Prop({ trim: true })
  address?: string;

  @Prop({ trim: true })
  city?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  pincode?: string;

  @Prop({ enum: PersonIdProofType })
  idProofType?: PersonIdProofType;

  @Prop({ trim: true })
  idProofNumber?: string;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ default: 0, min: 0 })
  vehiclesLinked!: number;

  @Prop({ default: 0, min: 0 })
  treesAssigned!: number;

  @Prop({ enum: PersonStatus, default: PersonStatus.ACTIVE, index: true })
  status!: PersonStatus;

  @Prop({ type: Date, default: Date.now })
  registrationDate!: Date;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.index({
  name: 'text',
  mobile: 'text',
  personId: 'text',
  email: 'text',
  idProofNumber: 'text',
});
