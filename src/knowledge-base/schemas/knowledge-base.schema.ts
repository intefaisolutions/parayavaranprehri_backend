import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type KnowledgeBaseDocument = HydratedDocument<KnowledgeBase>;

export enum KnowledgeBaseStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum KnowledgeBaseLanguage {
  ENGLISH = 'English',
  HINDI = 'Hindi',
}

@Schema({ timestamps: true, collection: 'knowledge_bases' })
export class KnowledgeBase extends BaseSchema {
  @Prop({ required: true, trim: true })
  question!: string;

  @Prop({ required: true, trim: true })
  answer!: string;

  @Prop({ required: true, trim: true, index: true })
  category!: string;

  @Prop({
    required: true,
    enum: KnowledgeBaseLanguage,
    default: KnowledgeBaseLanguage.ENGLISH,
    index: true,
  })
  language!: KnowledgeBaseLanguage;

  @Prop({
    required: true,
    enum: KnowledgeBaseStatus,
    default: KnowledgeBaseStatus.ACTIVE,
    index: true,
  })
  status!: KnowledgeBaseStatus;

  @Prop({ default: 0 })
  priority!: number;

  @Prop({ type: Types.ObjectId, ref: 'Person' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Person' })
  updatedBy?: Types.ObjectId;
}

export const KnowledgeBaseSchema = SchemaFactory.createForClass(KnowledgeBase);

// Text index for search functionality
KnowledgeBaseSchema.index(
  {
    question: 'text',
    answer: 'text',
    category: 'text',
  },
  {
    weights: {
      question: 10,
      category: 5,
      answer: 1,
    },
    name: 'knowledge_base_text_idx',
  },
);
