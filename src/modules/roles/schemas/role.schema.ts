import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SystemRole } from '../../../common/enums/role.enum';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ timestamps: true, collection: 'roles' })
export class Role extends BaseSchema {
  @Prop({ required: true, unique: true, enum: SystemRole })
  name!: SystemRole;

  @Prop({ required: true, trim: true })
  displayName!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Permission' }], default: [] })
  permissions!: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  permissionKeys!: string[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: false })
  isSystem!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1 });
