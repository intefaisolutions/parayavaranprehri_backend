import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SystemRole } from '../../../common/enums/role.enum';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User extends BaseSchema {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  /** Unique when present (sparse — optional on some admin users). */
  @Prop({ trim: true, unique: true, sparse: true, index: true })
  phone?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ type: [{ type: String, enum: SystemRole }], default: [SystemRole.USER], index: true })
  roles!: SystemRole[];

  @Prop({
    type: {
      status: { type: String, enum: ['NOT_SUBMITTED', 'PENDING', 'VERIFIED', 'REJECTED'], default: 'NOT_SUBMITTED' }
    },
    default: { status: 'NOT_SUBMITTED' }
  })
  vehicleInsurance!: { status: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED' };

  @Prop({
    type: {
      status: { type: String, enum: ['NOT_APPLIED', 'PENDING', 'APPROVED', 'REJECTED'], default: 'NOT_APPLIED' }
    },
    default: { status: 'NOT_APPLIED' }
  })
  mitraApplication!: { status: 'NOT_APPLIED' | 'PENDING' | 'APPROVED' | 'REJECTED' };

  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isEmailVerified!: boolean;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ trim: true })
  avatar?: string;

  @Prop({ trim: true })
  organizationId?: string;

  @Prop({ trim: true })
  district?: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true })
  vidhanSabha?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ roles: 1, isActive: 1 });
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
