import { Prop } from '@nestjs/mongoose';

export abstract class BaseSchema {
  @Prop({ default: false, index: true })
  isDeleted!: boolean;

  @Prop({ type: Date, default: null })
  deletedAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}
