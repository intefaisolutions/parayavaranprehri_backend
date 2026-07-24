import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type NewsDocument = HydratedDocument<News>;

export enum NewsCategory {
  ENVIRONMENT = 'Environment',
  EVENTS = 'Events',
  GOVERNMENT = 'Government',
  AWARENESS = 'Awareness',
}

export enum NewsStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  ARCHIVED = 'Archived',
}

@Schema({ timestamps: true, collection: 'news' })
export class News extends BaseSchema {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  content!: string;

  @Prop({ enum: NewsCategory, required: true, index: true })
  category!: NewsCategory;

  @Prop({ trim: true })
  image?: string;

  @Prop({ required: true, trim: true })
  author!: string;

  @Prop({ type: Date })
  publishedDate?: Date;

  @Prop({ default: 0 })
  views!: number;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ enum: NewsStatus, default: NewsStatus.DRAFT, index: true })
  status!: NewsStatus;
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({
  title: 'text',
  content: 'text',
  author: 'text',
});
