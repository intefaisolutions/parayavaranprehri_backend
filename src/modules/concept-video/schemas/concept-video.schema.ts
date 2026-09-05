import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConceptVideoDocument = ConceptVideo & Document;

@Schema({ timestamps: true })
export class ConceptVideo {
  @Prop({ default: 'What is Paryavaran Prahri?' })
  title!: string;

  @Prop({
    default:
      'Learn how vehicles, citizens, plantation and environmental contribution come together under Mission 2047.',
  })
  subtitle!: string;

  @Prop({ default: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  videoUrl!: string;

  @Prop({ default: 'dQw4w9WgXcQ' })
  youtubeId!: string;

  @Prop({ default: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg' })
  thumbnailUrl!: string;

  @Prop({ default: true })
  isActive!: boolean;
}

export const ConceptVideoSchema = SchemaFactory.createForClass(ConceptVideo);
