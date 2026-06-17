import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../../common/schemas/base.schema';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ timestamps: true, collection: 'permissions' })
export class Permission extends BaseSchema {
  @Prop({ required: true, unique: true, trim: true })
  key!: string;

  @Prop({ required: true, trim: true })
  resource!: string;

  @Prop({ required: true, trim: true })
  action!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
