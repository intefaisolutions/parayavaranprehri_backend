import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type MediaDocument = HydratedDocument<Media>;

export enum MediaType {
  IMAGE = 'Image',
  VIDEO = 'Video',
  PDF = 'PDF',
  DOCUMENT = 'Document',
}

export enum MediaUsageModule {
  NEWS = 'News',
  GALLERY = 'Gallery',
  PERSON = 'Person',
  VEHICLE = 'Vehicle',
  MAP = 'Map',
}

export enum MediaStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

@Schema({ timestamps: true, collection: 'media' })
export class Media extends BaseSchema {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ enum: MediaType, required: true, index: true })
  mediaType!: MediaType;

  @Prop({ required: true, trim: true })
  url!: string;

  @Prop({ trim: true })
  fileSize?: string;

  @Prop({ trim: true })
  uploadedBy?: string;

  @Prop({ enum: MediaUsageModule, index: true })
  usedInModule?: MediaUsageModule;

  @Prop({ enum: MediaStatus, default: MediaStatus.ACTIVE, index: true })
  status!: MediaStatus;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

MediaSchema.index({ name: 'text', uploadedBy: 'text' });
