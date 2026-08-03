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

export enum PersonSource {
  APP = 'app',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'persons' })
export class Person extends BaseSchema {
  @Prop({ index: true })
  personId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, index: true })
  mobile!: string;

  /** Unique when present among active (non-deleted) persons. */
  @Prop({ trim: true, lowercase: true, index: true })
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

  // Always Active on registration regardless of source or insurance
  // verification result — verification only informs vehiclesLinked/
  // insuranceVerified, it does not gate the account status.
  @Prop({ enum: PersonStatus, default: PersonStatus.ACTIVE, index: true })
  status!: PersonStatus;

  @Prop({ enum: PersonSource, default: PersonSource.ADMIN, index: true })
  source!: PersonSource;

  // Result of checking the insurance system's DB (by mobile number) for a
  // matching vehicle insurance policy at registration time.
  @Prop({ default: false })
  insuranceVerified!: boolean;

  @Prop({ type: Date, default: null })
  insuranceCheckedAt?: Date | null;

  @Prop({ type: Date, default: Date.now })
  registrationDate!: Date;

  /** Who created this record (email / display name). */
  @Prop({ trim: true })
  createdBy?: string;

  @Prop({ trim: true, index: true })
  createdByUserId?: string;

  /** Who last updated this record (email / display name). */
  @Prop({ trim: true })
  updatedBy?: string;

  @Prop({ trim: true, index: true })
  updatedByUserId?: string;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

// Soft-delete safe uniqueness — allows re-registering the same mobile/email
// after a person is soft-deleted (isDeleted: true).
PersonSchema.index(
  { personId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
PersonSchema.index(
  { mobile: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } },
);
PersonSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      email: { $type: 'string' },
    },
  },
);

PersonSchema.index({
  name: 'text',
  mobile: 'text',
  personId: 'text',
  email: 'text',
  idProofNumber: 'text',
});
