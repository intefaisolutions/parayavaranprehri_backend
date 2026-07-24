import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type LeaderDocument = HydratedDocument<Leader>;

@Schema({ timestamps: true, collection: 'leaders' })
export class Leader extends BaseSchema {
  @Prop({ required: true, trim: true })
  leaderName!: string;

  @Prop({ required: true, trim: true })
  designation!: string;

  @Prop({ trim: true })
  organization?: string;

  @Prop({ trim: true })
  photo?: string;

  @Prop({ default: 0, index: true })
  displayOrder!: number;

  @Prop({ default: true, index: true })
  isActive!: boolean;
}

export const LeaderSchema = SchemaFactory.createForClass(Leader);

LeaderSchema.index({
  leaderName: 'text',
  designation: 'text',
  organization: 'text',
});
