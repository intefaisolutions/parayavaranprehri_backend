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

  @Prop({ trim: true })
  phone?: string;

  @Prop({ select: false })
  password?: string;

  @Prop({ required: true, enum: SystemRole, index: true })
  role!: SystemRole;

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
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });
