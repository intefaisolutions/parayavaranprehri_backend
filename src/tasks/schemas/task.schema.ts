import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseSchema } from '../../common/schemas/base.schema';

export type TaskDocument = HydratedDocument<Task>;

export enum TaskType {
  SURVEY = 'Survey',
  PLANTATION = 'Plantation',
  INSPECTION = 'Inspection',
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum TaskStatus {
  PENDING = 'Pending',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
}

@Schema({ timestamps: true, collection: 'tasks' })
export class Task extends BaseSchema {
  @Prop({ required: true, trim: true })
  taskTitle!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ enum: TaskType, required: true })
  taskType!: TaskType;

  @Prop({ trim: true })
  assignedMitra?: string;

  @Prop({ trim: true, index: true })
  vidhanSabha?: string;

  @Prop({ trim: true })
  zone?: string;

  @Prop({ trim: true })
  sector?: string;

  @Prop({ type: Date, required: true })
  dueDate!: Date;

  @Prop({ enum: TaskPriority, default: TaskPriority.MEDIUM, index: true })
  priority!: TaskPriority;

  @Prop({ enum: TaskStatus, default: TaskStatus.PENDING, index: true })
  status!: TaskStatus;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({
  taskTitle: 'text',
  assignedMitra: 'text',
  vidhanSabha: 'text',
  zone: 'text',
  sector: 'text',
});
